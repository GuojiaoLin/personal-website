export interface ProjectImageSource {
  slug: string;
  coverImageUrl?: string | null;
}

export interface ProjectExperienceSource {
  slug: string;
}

export type ProjectImageFallbacks = Record<string, string | undefined>;

const nonProjectExperienceSlugs = new Set(['agent']);

export const resolveProjectImage = (
  project: ProjectImageSource,
  fallbackImages: ProjectImageFallbacks,
) => {
  const selectedImage = project.coverImageUrl?.trim();

  if (selectedImage) {
    return selectedImage;
  }

  return fallbackImages[project.slug] ?? fallbackImages.default ?? '';
};

export const filterProjectExperiences = <T extends ProjectExperienceSource>(projects: T[]) => (
  projects.filter((project) => !nonProjectExperienceSlugs.has(project.slug))
);
