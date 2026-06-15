package com.guojiaolin.website.content;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
public class DefaultContentSeedService implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DefaultContentSeedService.class);
  private static final Pattern FRONTMATTER = Pattern.compile("^---\\R([\\s\\S]*?)\\R---\\R?");
  private static final Set<String> SUPPORTED_MARKDOWN_EXTENSIONS = Set.of(".md", ".markdown");
  private static final ZoneId CONTENT_ZONE = ZoneId.of("Asia/Shanghai");
  private static final List<DefaultProject> DEFAULT_PROJECTS = List.of(
    new DefaultProject(
      "momozhi",
      "墨墨知 AI 智能论文阅读平台",
      "一个面向科研与学习场景的 AI 论文助手，聚合论文发现、批量解析、深度解读、研究问答、内容发布和科研画像。",
      List.of("React Native", "Next.js", "FastAPI", "Agentic RAG", "LangGraph"),
      "research",
      10
    ),
    new DefaultProject(
      "mmcsa",
      "多模态智能客服 Agent",
      "一个面向产品售后问答的智能客服中枢，融合图片理解、手册检索、会话记忆和质量校验，能生成带依据、可配图的中英文回复。",
      List.of("React", "Spring Boot", "PostgreSQL", "RAG", "Multimodal Agent"),
      "bot",
      20
    )
  );

  private final ProjectRepository projects;
  private final BlogPostRepository blogPosts;
  private final JsonListMapper jsonListMapper;
  private final boolean enabled;
  private final String configuredBlogDirectory;

  public DefaultContentSeedService(
    ProjectRepository projects,
    BlogPostRepository blogPosts,
    JsonListMapper jsonListMapper,
    @Value("${site.content.seed.enabled:false}") boolean enabled,
    @Value("${site.content.seed.blog-directory:}") String configuredBlogDirectory
  ) {
    this.projects = projects;
    this.blogPosts = blogPosts;
    this.jsonListMapper = jsonListMapper;
    this.enabled = enabled;
    this.configuredBlogDirectory = configuredBlogDirectory;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!enabled) {
      return;
    }

    var seededProjects = projects.count() == 0 ? seedProjects() : existingDefaultProjects();
    if (blogPosts.count() > 0) {
      return;
    }

    resolveBlogDirectory()
      .ifPresentOrElse(
        blogDirectory -> seedBlogPosts(blogDirectory, seededProjects),
        () -> log.info("Default blog seed directory not found; skipping blog seed.")
      );
  }

  private Map<String, Project> seedProjects() {
    var projectBySlug = new LinkedHashMap<String, Project>();

    for (var seed : DEFAULT_PROJECTS) {
      var project = projects.findBySlugIgnoreCase(seed.slug())
        .orElseGet(() -> projects.save(toProject(seed)));
      projectBySlug.put(project.getSlug(), project);
    }

    return projectBySlug;
  }

  private Map<String, Project> existingDefaultProjects() {
    var projectBySlug = new LinkedHashMap<String, Project>();
    for (var seed : DEFAULT_PROJECTS) {
      projects.findBySlugIgnoreCase(seed.slug())
        .ifPresent(project -> projectBySlug.put(project.getSlug(), project));
    }
    return projectBySlug;
  }

  private Project toProject(DefaultProject seed) {
    var project = new Project();
    project.setTitle(seed.title());
    project.setSlug(seed.slug());
    project.setSummary(seed.summary());
    project.setDescriptionMarkdown(seed.summary());
    project.setTechStack(jsonListMapper.toJson(seed.techStack()));
    project.setProjectIcon(seed.icon());
    project.setSortOrder(seed.sortOrder());
    project.setStatus(ContentStatus.PUBLISHED);
    return project;
  }

  private void seedBlogPosts(Path blogDirectory, Map<String, Project> projectBySlug) {
    try (var stream = Files.walk(blogDirectory)) {
      var markdownFiles = stream
        .filter(Files::isRegularFile)
        .filter(path -> SUPPORTED_MARKDOWN_EXTENSIONS.contains(extensionOf(path.getFileName().toString())))
        .sorted(Comparator.comparing(path -> blogDirectory.relativize(path).toString()))
        .toList();

      for (var markdownFile : markdownFiles) {
        seedBlogPost(blogDirectory, markdownFile, projectBySlug);
      }
    } catch (IOException error) {
      log.warn("Default blog seed failed: {}", error.getMessage());
    }
  }

  private void seedBlogPost(Path blogDirectory, Path markdownFile, Map<String, Project> projectBySlug) {
    try {
      var parsed = parseMarkdown(Files.readString(markdownFile));
      if (isDraft(parsed.metadata())) {
        return;
      }

      var pathInfo = pathInfo(blogDirectory, markdownFile);
      var projectSlug = clean(parsed.metadata().get("projectSlug")).isBlank()
        ? pathInfo.projectSlug()
        : clean(parsed.metadata().get("projectSlug")).toLowerCase(Locale.ROOT);
      var project = projectBySlug.computeIfAbsent(projectSlug, slug -> projects.findBySlugIgnoreCase(slug)
        .orElseGet(() -> seedProjectFromPost(slug, parsed)));
      var slug = "%s/%s".formatted(projectSlug, pathInfo.fileSlug());

      if (blogPosts.existsByProject_IdAndSlugIgnoreCase(project.getId(), slug)) {
        return;
      }

      var post = new BlogPost();
      post.setProject(project);
      post.setTitle(valueOr(parsed.metadata().get("title"), titleize(pathInfo.fileSlug())));
      post.setSlug(slug);
      post.setCategory(valueOr(parsed.metadata().get("category"), "随笔"));
      post.setSummary(valueOr(parsed.metadata().get("summary"), firstLine(parsed.body())));
      post.setContentMarkdown(parsed.body());
      post.setBlogOrder(numberOrZero(parsed.metadata().get("order")));
      post.setFeaturedOnHome(true);
      post.setHomeOrder(post.getBlogOrder());
      post.setStatus(ContentStatus.PUBLISHED);
      post.setPublishedAt(parseDate(parsed.metadata().get("date")));
      blogPosts.save(post);
    } catch (IOException error) {
      log.warn("Skipping blog seed file {}: {}", markdownFile, error.getMessage());
    }
  }

  private Project seedProjectFromPost(String slug, ParsedMarkdown parsed) {
    var project = new Project();
    project.setSlug(slug);
    project.setTitle(valueOr(parsed.metadata().get("project"), titleize(slug)));
    project.setSummary(valueOr(parsed.metadata().get("projectDescription"), valueOr(parsed.metadata().get("summary"), "")));
    project.setDescriptionMarkdown(project.getSummary());
    project.setTechStack(jsonListMapper.toJson(List.of()));
    project.setProjectIcon("folder");
    project.setSortOrder(100);
    project.setStatus(ContentStatus.PUBLISHED);
    return projects.save(project);
  }

  private Optional<Path> resolveBlogDirectory() {
    return List.of(
        configuredBlogDirectory,
        "../src/content/blog",
        "src/content/blog"
      ).stream()
      .filter(StringUtils::hasText)
      .map(Path::of)
      .map(path -> path.toAbsolutePath().normalize())
      .filter(Files::isDirectory)
      .findFirst();
  }

  private ParsedMarkdown parseMarkdown(String source) {
    var matcher = FRONTMATTER.matcher(source);
    if (!matcher.find()) {
      return new ParsedMarkdown(Map.of(), source.trim());
    }

    var metadata = new LinkedHashMap<String, String>();
    for (var line : matcher.group(1).split("\\R")) {
      var separator = line.indexOf(':');
      if (separator < 0) {
        continue;
      }

      var key = line.substring(0, separator).trim();
      var value = line.substring(separator + 1).trim();
      if (!key.isBlank()) {
        metadata.put(key, stripQuotes(value));
      }
    }

    return new ParsedMarkdown(metadata, source.substring(matcher.end()).trim());
  }

  private PathInfo pathInfo(Path blogDirectory, Path markdownFile) {
    var relative = blogDirectory.relativize(markdownFile);
    var parent = relative.getParent();
    var projectSlug = parent == null ? "uncategorized" : parent.getName(0).toString();
    var fileName = markdownFile.getFileName().toString();
    var fileSlug = fileName.substring(0, fileName.lastIndexOf('.'));
    return new PathInfo(projectSlug, fileSlug);
  }

  private boolean isDraft(Map<String, String> metadata) {
    return "true".equalsIgnoreCase(clean(metadata.get("draft")));
  }

  private int numberOrZero(String value) {
    try {
      return clean(value).isBlank() ? 0 : Integer.parseInt(clean(value));
    } catch (NumberFormatException error) {
      return 0;
    }
  }

  private java.time.Instant parseDate(String value) {
    try {
      return clean(value).isBlank()
        ? java.time.Instant.now()
        : LocalDate.parse(clean(value)).atStartOfDay(CONTENT_ZONE).toInstant();
    } catch (RuntimeException error) {
      return java.time.Instant.now();
    }
  }

  private String firstLine(String body) {
    return body.lines()
      .map(this::clean)
      .filter(line -> !line.isBlank())
      .findFirst()
      .orElse("");
  }

  private String valueOr(String value, String fallback) {
    var cleaned = clean(value);
    return cleaned.isBlank() ? fallback : cleaned;
  }

  private String titleize(String value) {
    var cleaned = clean(value).replace('-', ' ').replace('_', ' ');
    if (cleaned.isBlank()) {
      return "Untitled";
    }
    return cleaned;
  }

  private String extensionOf(String fileName) {
    var dotIndex = fileName.lastIndexOf('.');
    return dotIndex > 0 ? fileName.substring(dotIndex).toLowerCase(Locale.ROOT) : "";
  }

  private String stripQuotes(String value) {
    var cleaned = clean(value);
    if ((cleaned.startsWith("\"") && cleaned.endsWith("\"")) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      return cleaned.substring(1, cleaned.length() - 1);
    }
    return cleaned;
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private record DefaultProject(
    String slug,
    String title,
    String summary,
    List<String> techStack,
    String icon,
    int sortOrder
  ) {
  }

  private record ParsedMarkdown(Map<String, String> metadata, String body) {
  }

  private record PathInfo(String projectSlug, String fileSlug) {
  }
}
