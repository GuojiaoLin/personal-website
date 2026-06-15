package com.guojiaolin.website.about;

import com.guojiaolin.website.common.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "about_content")
public class AboutContent extends AuditedEntity {

  @Column(nullable = false, unique = true)
  private String contentKey = "main";

  @Column(nullable = false, columnDefinition = "text")
  private String portraitImageUrl = "";

  @Column(nullable = false, columnDefinition = "text")
  private String wechatQrImageUrl = "";

  @Column(nullable = false, columnDefinition = "text")
  private String profileDetails = "[]";

  @Column(nullable = false, columnDefinition = "text")
  private String resumeEntries = "[]";

  @Column(nullable = false)
  private String contactHeading = "";

  @Column(nullable = false, columnDefinition = "text")
  private String contactItems = "[]";

  @Column(nullable = false, columnDefinition = "text")
  private String socialLinks = "[]";

  public String getContentKey() {
    return contentKey;
  }

  public void setContentKey(String contentKey) {
    this.contentKey = contentKey;
  }

  public String getPortraitImageUrl() {
    return portraitImageUrl;
  }

  public void setPortraitImageUrl(String portraitImageUrl) {
    this.portraitImageUrl = portraitImageUrl;
  }

  public String getWechatQrImageUrl() {
    return wechatQrImageUrl;
  }

  public void setWechatQrImageUrl(String wechatQrImageUrl) {
    this.wechatQrImageUrl = wechatQrImageUrl;
  }

  public String getProfileDetails() {
    return profileDetails;
  }

  public void setProfileDetails(String profileDetails) {
    this.profileDetails = profileDetails;
  }

  public String getResumeEntries() {
    return resumeEntries;
  }

  public void setResumeEntries(String resumeEntries) {
    this.resumeEntries = resumeEntries;
  }

  public String getContactHeading() {
    return contactHeading;
  }

  public void setContactHeading(String contactHeading) {
    this.contactHeading = contactHeading;
  }

  public String getContactItems() {
    return contactItems;
  }

  public void setContactItems(String contactItems) {
    this.contactItems = contactItems;
  }

  public String getSocialLinks() {
    return socialLinks;
  }

  public void setSocialLinks(String socialLinks) {
    this.socialLinks = socialLinks;
  }
}
