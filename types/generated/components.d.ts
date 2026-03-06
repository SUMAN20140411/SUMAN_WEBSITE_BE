import type { Schema, Struct } from '@strapi/strapi';

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

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.bubble-keys': HomepageBubbleKeys;
      'homepage.section2': HomepageSection2;
      'homepage.section3': HomepageSection3;
      'homepage.section4': HomepageSection4;
      'homepage.services': HomepageServices;
      'homepage.solutions': HomepageSolutions;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
