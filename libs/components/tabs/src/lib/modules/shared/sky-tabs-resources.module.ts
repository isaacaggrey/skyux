/**
 * NOTICE: DO NOT MODIFY THIS FILE!
 * The contents of this file were automatically generated by
 * the 'ng generate @skyux/i18n:lib-resources-module modules/shared/sky-tabs' schematic.
 * To update this file, simply rerun the command.
 */

import { NgModule } from '@angular/core';
import {
  getLibStringForLocale,
  SkyAppLocaleInfo,
  SkyI18nModule,
  SkyLibResources,
  SkyLibResourcesProvider,
  SKY_LIB_RESOURCES_PROVIDERS,
} from '@skyux/i18n';

const RESOURCES: { [locale: string]: SkyLibResources } = {
  'EN-US': {
    skyux_tab_add: { message: 'Add tab' },
    skyux_tab_close: { message: 'Close {0} tab' },
    skyux_tabs_navigator_next: { message: 'Next' },
    skyux_tabs_navigator_previous: { message: 'Previous' },
    skyux_tab_open: { message: 'Open tab' },
    skyux_vertical_tabs_show_tabs_text: { message: 'Tab list' },
  },
};

export class SkyTabsResourcesProvider implements SkyLibResourcesProvider {
  public getString(localeInfo: SkyAppLocaleInfo, name: string): string {
    return getLibStringForLocale(RESOURCES, localeInfo.locale, name);
  }
}

/**
 * Import into any component library module that needs to use resource strings.
 */
@NgModule({
  exports: [SkyI18nModule],
  providers: [
    {
      provide: SKY_LIB_RESOURCES_PROVIDERS,
      useClass: SkyTabsResourcesProvider,
      multi: true,
    },
  ],
})
export class SkyTabsResourcesModule {}
