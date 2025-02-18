import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SkyIdModule, SkyIdService } from '@skyux/core';
import { SkyLibResourcesService } from '@skyux/i18n';
import { SkyThemeModule } from '@skyux/theme';

import { Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { SkyModalContentComponent } from '../modal/modal-content.component';
import { SkyModalInstance } from '../modal/modal-instance';
import { SkyModalComponent } from '../modal/modal.component';
import { SkyModalsResourcesModule } from '../shared/sky-modals-resources.module';

import { SkyConfirmButton } from './confirm-button';
import { SkyConfirmButtonConfig } from './confirm-button-config';
import { SkyConfirmCloseEventArgs } from './confirm-closed-event-args';
import { SkyConfirmConfig } from './confirm-config';
import { SKY_CONFIRM_CONFIG } from './confirm-config-token';
import { SkyConfirmType } from './confirm-type';

@Component({
  standalone: true,
  selector: 'sky-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
  imports: [
    CommonModule,
    SkyIdModule,
    SkyModalComponent,
    SkyModalContentComponent,
    SkyModalsResourcesModule,
    SkyThemeModule,
  ],
})
export class SkyConfirmComponent {
  public buttons: SkyConfirmButton[] | undefined;
  public message: string;
  public body: string | undefined;
  public bodyId: string;
  public preserveWhiteSpace = false;
  public isOkType = false;

  #config: SkyConfirmConfig;
  #modal: SkyModalInstance;
  #resourcesService: SkyLibResourcesService;

  constructor(
    @Inject(SKY_CONFIRM_CONFIG)
    config: SkyConfirmConfig,
    modal: SkyModalInstance,
    resourcesService: SkyLibResourcesService,
    idService: SkyIdService,
  ) {
    this.#config = config;
    this.#modal = modal;
    this.#resourcesService = resourcesService;

    if (
      config.type === SkyConfirmType.Custom &&
      config.buttons &&
      config.buttons.length > 0
    ) {
      this.buttons = this.#getCustomButtons(config.buttons);
    } else {
      this.#getPresetButtons()
        .pipe(take(1))
        .subscribe((buttons: SkyConfirmButton[]) => {
          this.buttons = buttons;
        });
    }

    this.message = config.message;
    this.body = config.body;
    // Using the service here instead of the directive due to the confirm component's "body" container being conditional and thus a template variable being unavailable at an outer scope
    this.bodyId = idService.generateId();
    this.preserveWhiteSpace = !!config.preserveWhiteSpace;
    this.isOkType = config.type === SkyConfirmType.OK;
  }

  public close(button: SkyConfirmButton): void {
    const result: SkyConfirmCloseEventArgs = {
      action: button.action,
    };

    this.#modal.close(result);
  }

  #getPresetButtons(): Observable<SkyConfirmButton[]> {
    const emitter = new ReplaySubject<SkyConfirmButton[]>(1);

    this.#resourcesService
      .getStrings({
        cancel: 'skyux_confirm_dialog_default_cancel_text',
        no: 'skyux_confirm_dialog_default_no_text',
        ok: 'skyux_confirm_dialog_default_ok_text',
        yes: 'skyux_confirm_dialog_default_yes_text',
      })
      .subscribe((values) => {
        const confirmButtons: SkyConfirmButton[] = [];

        switch (this.#config.type) {
          case SkyConfirmType.YesNoCancel:
          case SkyConfirmType.YesCancel:
            confirmButtons.push({
              text: values.yes,
              autofocus: true,
              styleType: 'primary',
              action: 'yes',
            });

            if (this.#config.type === SkyConfirmType.YesNoCancel) {
              confirmButtons.push({
                text: values.no,
                styleType: 'default',
                action: 'no',
              });
            }

            confirmButtons.push({
              text: values.cancel,
              styleType: 'link',
              action: 'cancel',
            });
            break;
          default:
            confirmButtons.push({
              text: values.ok,
              autofocus: true,
              styleType: 'primary',
              action: 'ok',
            });
        }

        emitter.next(confirmButtons);
      });

    return emitter.asObservable();
  }

  #getCustomButtons(
    buttonConfig: SkyConfirmButtonConfig[],
  ): SkyConfirmButton[] {
    return buttonConfig.map(
      (config) =>
        ({
          text: config.text,
          action: config.action,
          styleType: config.styleType || 'default',
          autofocus: config.autofocus || false,
        } as SkyConfirmButton),
    );
  }
}
