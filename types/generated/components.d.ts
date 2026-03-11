import type { Schema, Struct } from '@strapi/strapi';

export interface CertificationPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_certification_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    keywords: Schema.Attribute.Component<'shared.quote', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CiPageColors extends Struct.ComponentSchema {
  collectionName: 'components_ci_page_colors';
  info: {
    displayName: 'colors';
    icon: 'brush';
  };
  attributes: {
    color: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'plugin::color-picker.color'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pantoneColor: Schema.Attribute.String;
  };
}

export interface CiPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_ci_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CiPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_ci_page_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    logoFiles: Schema.Attribute.Component<'shared.media', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HistoryPageHistoryList extends Struct.ComponentSchema {
  collectionName: 'components_history_page_history_lists';
  info: {
    displayName: 'historyList';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    period: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HistoryPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_history_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    keywords: Schema.Attribute.Component<'shared.quote', true>;
    sales: Schema.Attribute.String & Schema.Attribute.DefaultTo<'sales'>;
    title: Schema.Attribute.Text & Schema.Attribute.Required;
    worker: Schema.Attribute.String;
  };
}

export interface HistoryPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_history_page_section2s';
  info: {
    displayName: 'section2';
  };
  attributes: {
    historyList: Schema.Attribute.Component<'history-page.history-list', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageBubbleKeys extends Struct.ComponentSchema {
  collectionName: 'components_homepage_bubble_keys';
  info: {
    displayName: 'bubbleKeys';
    icon: 'information';
  };
  attributes: {
    korTitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_homepage_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    keywords: Schema.Attribute.Component<'homepage.bubble-keys', true>;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomepageSection3 extends Struct.ComponentSchema {
  collectionName: 'components_homepage_section3s';
  info: {
    displayName: 'section3';
    icon: 'apps';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    solutions: Schema.Attribute.Component<'homepage.solutions', true>;
    title: Schema.Attribute.String;
  };
}

export interface HomepageSection4 extends Struct.ComponentSchema {
  collectionName: 'components_homepage_section4s';
  info: {
    displayName: 'section4';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    services: Schema.Attribute.Component<'homepage.services', true>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomepageServices extends Struct.ComponentSchema {
  collectionName: 'components_homepage_services';
  info: {
    displayName: 'services';
    icon: 'information';
  };
  attributes: {
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageSolutions extends Struct.ComponentSchema {
  collectionName: 'components_homepage_solutions';
  info: {
    displayName: 'solutions';
    icon: 'information';
  };
  attributes: {
    description: Schema.Attribute.String & Schema.Attribute.Required;
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    korTitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationPageLocationItem extends Struct.ComponentSchema {
  collectionName: 'components_location_page_location_items';
  info: {
    displayName: 'locationItem';
    icon: 'car';
  };
  attributes: {
    address: Schema.Attribute.String & Schema.Attribute.Required;
    latitude: Schema.Attribute.Float;
    longitude: Schema.Attribute.Float;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_location_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    locations: Schema.Attribute.Relation<'oneToMany', 'api::location.location'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NoticePageForms extends Struct.ComponentSchema {
  collectionName: 'components_notice_page_forms';
  info: {
    displayName: 'forms';
    icon: 'dashboard';
  };
  attributes: {
    description: Schema.Attribute.Text;
    downloadText: Schema.Attribute.String;
    file: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    iconColor: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::color-picker.color'>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NoticePageJobSites extends Struct.ComponentSchema {
  collectionName: 'components_notice_page_job_sites';
  info: {
    displayName: 'jobSites';
    icon: 'dashboard';
  };
  attributes: {
    description: Schema.Attribute.Text;
    link: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NoticePageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_notice_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    jobSites: Schema.Attribute.Component<'notice-page.job-sites', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NoticePageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_notice_page_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    forms: Schema.Attribute.Component<'notice-page.forms', true>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface OrganizationPageDepartments extends Struct.ComponentSchema {
  collectionName: 'components_organization_page_departments';
  info: {
    displayName: 'departments';
    icon: 'cog';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    teams: Schema.Attribute.Component<'shared.text', true>;
  };
}

export interface OrganizationPageOrgChart extends Struct.ComponentSchema {
  collectionName: 'components_organization_page_org_charts';
  info: {
    displayName: 'orgChart';
    icon: 'cog';
  };
  attributes: {
    advisor: Schema.Attribute.String;
    board: Schema.Attribute.String;
    ceo: Schema.Attribute.String;
    departments: Schema.Attribute.Component<
      'organization-page.departments',
      true
    >;
    logo: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
  };
}

export interface PhilosophyPageKeywords extends Struct.ComponentSchema {
  collectionName: 'components_philosophy_page_keywords';
  info: {
    displayName: 'keywords';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    hero: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PhilosophyPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_philosophy_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<
        'plugin::strapi-plugin-iconhub.iconhub',
        {
          storeIconData: true;
          storeIconName: true;
        }
      >;
    position: Schema.Attribute.String;
    state: Schema.Attribute.String;
    submitButton: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ProductPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_product_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    footnote: Schema.Attribute.Text;
    products: Schema.Attribute.Component<'homepage.solutions', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface RndPageResearchItem extends Struct.ComponentSchema {
  collectionName: 'components_rnd_page_research_items';
  info: {
    displayName: 'researchItem';
    icon: 'dashboard';
  };
  attributes: {
    description: Schema.Attribute.RichText;
    hero: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    icon: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<
        'plugin::strapi-plugin-iconhub.iconhub',
        {
          storeIconData: true;
          storeIconName: true;
        }
      >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface RndPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_rnd_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    researchItems: Schema.Attribute.Component<'rnd-page.research-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface RndPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_rnd_page_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServicePageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_service_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    img: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface ServicePageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_service_page_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    deviceCategories: Schema.Attribute.Component<
      'shared.device-category',
      true
    >;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedDeviceCategory extends Struct.ComponentSchema {
  collectionName: 'components_shared_device_categories';
  info: {
    displayName: 'deviceCategory';
    icon: 'dashboard';
  };
  attributes: {
    equipment: Schema.Attribute.Relation<
      'oneToMany',
      'api::equipment.equipment'
    >;
    title: Schema.Attribute.String;
  };
}

export interface SharedHeaderItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_header_items';
  info: {
    displayName: 'headerItem';
    icon: 'store';
  };
  attributes: {
    subItems: Schema.Attribute.Component<'shared.header-sub', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedHeaderSub extends Struct.ComponentSchema {
  collectionName: 'components_shared_header_subs';
  info: {
    displayName: 'headerSub';
    icon: 'dashboard';
  };
  attributes: {
    pageAddress: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedInfoCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_info_cards';
  info: {
    displayName: 'infoCard';
    icon: 'information';
  };
  attributes: {
    description: Schema.Attribute.Blocks;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
  };
}

export interface SharedPageInfo extends Struct.ComponentSchema {
  collectionName: 'components_shared_page_infos';
  info: {
    displayName: 'PageInfo';
    icon: 'information';
  };
  attributes: {
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    pageLocation: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    hero: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSignature extends Struct.ComponentSchema {
  collectionName: 'components_shared_signatures';
  info: {
    displayName: 'Signature';
    icon: 'brush';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    position: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedText extends Struct.ComponentSchema {
  collectionName: 'components_shared_texts';
  info: {
    displayName: 'Text';
    icon: 'italic';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface VisionPageSection1 extends Struct.ComponentSchema {
  collectionName: 'components_vision_page_section1s';
  info: {
    displayName: 'section1';
    icon: 'apps';
  };
  attributes: {
    emphasizedSubtitle: Schema.Attribute.String;
    subsection: Schema.Attribute.Component<'shared.info-card', false>;
    subtitle: Schema.Attribute.String;
    targetIncome: Schema.Attribute.String;
    targetSales: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface VisionPageSection2 extends Struct.ComponentSchema {
  collectionName: 'components_vision_page_section2s';
  info: {
    displayName: 'section2';
    icon: 'apps';
  };
  attributes: {
    subsection: Schema.Attribute.Component<'shared.info-card', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface VisionPageSection4 extends Struct.ComponentSchema {
  collectionName: 'components_vision_page_section4s';
  info: {
    displayName: 'section4';
    icon: 'apps';
  };
  attributes: {
    emphasizedSubtitle: Schema.Attribute.String;
    img: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::cloudinary-media-library.cloudinary'>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'certification-page.section1': CertificationPageSection1;
      'ci-page.colors': CiPageColors;
      'ci-page.section1': CiPageSection1;
      'ci-page.section2': CiPageSection2;
      'history-page.history-list': HistoryPageHistoryList;
      'history-page.section1': HistoryPageSection1;
      'history-page.section2': HistoryPageSection2;
      'homepage.bubble-keys': HomepageBubbleKeys;
      'homepage.section2': HomepageSection2;
      'homepage.section3': HomepageSection3;
      'homepage.section4': HomepageSection4;
      'homepage.services': HomepageServices;
      'homepage.solutions': HomepageSolutions;
      'location-page.location-item': LocationPageLocationItem;
      'location-page.section1': LocationPageSection1;
      'notice-page.forms': NoticePageForms;
      'notice-page.job-sites': NoticePageJobSites;
      'notice-page.section1': NoticePageSection1;
      'notice-page.section2': NoticePageSection2;
      'organization-page.departments': OrganizationPageDepartments;
      'organization-page.org-chart': OrganizationPageOrgChart;
      'philosophy-page.keywords': PhilosophyPageKeywords;
      'philosophy-page.section1': PhilosophyPageSection1;
      'product-page.section1': ProductPageSection1;
      'rnd-page.research-item': RndPageResearchItem;
      'rnd-page.section1': RndPageSection1;
      'rnd-page.section2': RndPageSection2;
      'service-page.section1': ServicePageSection1;
      'service-page.section2': ServicePageSection2;
      'shared.device-category': SharedDeviceCategory;
      'shared.header-item': SharedHeaderItem;
      'shared.header-sub': SharedHeaderSub;
      'shared.info-card': SharedInfoCard;
      'shared.media': SharedMedia;
      'shared.page-info': SharedPageInfo;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.signature': SharedSignature;
      'shared.slider': SharedSlider;
      'shared.text': SharedText;
      'vision-page.section1': VisionPageSection1;
      'vision-page.section2': VisionPageSection2;
      'vision-page.section4': VisionPageSection4;
    }
  }
}
