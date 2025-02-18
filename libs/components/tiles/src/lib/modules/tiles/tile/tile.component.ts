import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
} from '@angular/core';
import { skyAnimationSlide } from '@skyux/animations';
import { SkyIdModule } from '@skyux/core';
import { SkyChevronModule, SkyIconModule } from '@skyux/indicators';
import { SkyThemeModule } from '@skyux/theme';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SkyTilesResourcesModule } from '../../shared/sky-tiles-resources.module';
import { SkyTileDashboardService } from '../tile-dashboard/tile-dashboard.service';

/**
 * Provides a common look-and-feel for tab content.
 */
@Component({
  standalone: true,
  selector: 'sky-tile',
  styleUrls: ['./tile.component.scss'],
  templateUrl: './tile.component.html',
  animations: [skyAnimationSlide],
  imports: [
    CommonModule,
    SkyChevronModule,
    SkyIconModule,
    SkyIdModule,
    SkyThemeModule,
    SkyTilesResourcesModule,
  ],
})
export class SkyTileComponent implements OnDestroy {
  /**
   * Whether to display a settings button in the tile header. To display the
   * button, you must also listen for the `settingsClick` event.
   * @default true
   */
  @Input()
  public showSettings = true;

  /**
   * Whether to display a help button in the tile header. To display the
   * button, you must also listen for the `helpClick` event.
   * @default true
   */
  @Input()
  public showHelp = true;

  /**
   * The human-readable name for the tile that is available to the tile controls for multiple purposes, such as accessibility and instrumentation. The component uses the name to construct ARIA labels for the help, expand/collapse, settings, and drag handle buttons to [support accessibility](https://developer.blackbaud.com/skyux/learn/accessibility).
   * For example, if the tile name is "Constituents," the help input's `aria-label` is "Constituents help" and the drag handle's `aria-label` is "Move Constituents." For more information about the `aria-label` attribute, see the [WAI-ARIA definition](https://www.w3.org/TR/wai-aria/#aria-label).
   */
  @Input()
  public tileName: string | undefined;

  /**
   * Fires when users select the settings button in the tile header. The settings
   * button only appears when the `showSettings` property is set to `true`.
   */
  @Output()
  public settingsClick = new EventEmitter();

  /**
   * Fires when the tile's collapsed state changes. Returns `true` when the tile
   * collapses and `false` when it expands.
   */
  @Output()
  public isCollapsedChange = new EventEmitter<boolean>();

  /**
   * Fires when users select the help button in the tile header. The help
   * button only appears when the `showHelp` property is set to `true`.
   */
  @Output()
  public helpClick = new EventEmitter();

  public get isCollapsed(): boolean {
    if (this.#dashboardService) {
      const configCollapsedState = this.#dashboardService.tileIsCollapsed(this);
      this.#_isCollapsed = configCollapsedState;
    }

    return this.#_isCollapsed;
  }

  /**
   * Whether the tile is in a collapsed state.
   * @default false
   */
  @Input()
  public set isCollapsed(value: boolean | undefined) {
    this.#_isCollapsed = !!value;

    if (this.#dashboardService) {
      this.#dashboardService.setTileCollapsed(this, this.#_isCollapsed);
    }

    this.isCollapsedChange.emit(this.#_isCollapsed);
  }

  public ariaDescribedBy: string | undefined;

  public isInDashboardColumn = false;

  @ViewChild('grabHandle', {
    read: ElementRef,
    static: false,
  })
  public grabHandle: ElementRef | undefined;

  @ViewChild('titleContainer', {
    read: ElementRef,
    static: false,
  })
  public title: ElementRef | undefined;

  #changeDetector: ChangeDetectorRef;
  #dashboardService: SkyTileDashboardService | undefined;
  #ngUnsubscribe = new Subject<void>();
  #_isCollapsed = false;

  constructor(
    public elementRef: ElementRef,
    changeDetector: ChangeDetectorRef,
    @Optional() dashboardService?: SkyTileDashboardService,
  ) {
    this.#changeDetector = changeDetector;
    this.#dashboardService = dashboardService;
    this.isInDashboardColumn = !!this.#dashboardService;

    if (this.#dashboardService) {
      this.ariaDescribedBy = `${
        this.#dashboardService.bagId
      }-move-instructions`;

      /**
       * This subscription ensures that if any values which come in from the dashboard service are
       * updated that the component will update if the tile's parent component utilizes OnPush
       * change detection.
       */
      this.#dashboardService.configChange
        .pipe(takeUntil(this.#ngUnsubscribe))
        .subscribe(() => {
          this.#changeDetector.markForCheck();
        });
    }
  }

  public ngOnDestroy(): void {
    this.#ngUnsubscribe.next();
    this.#ngUnsubscribe.complete();
  }

  public settingsButtonClicked(): void {
    this.settingsClick.emit(undefined);
  }

  public helpButtonClicked(): void {
    this.helpClick.emit(undefined);
  }

  public get hasSettings(): boolean {
    return this.settingsClick.observers.length > 0 && this.showSettings;
  }

  public get hasHelp(): boolean {
    return this.helpClick.observers.length > 0 && this.showHelp;
  }

  public titleClick(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  public chevronDirectionChange(direction: string): void {
    this.isCollapsed = direction === 'down';
  }

  public moveTile(event: KeyboardEvent): void {
    /* istanbul ignore else */
    if (this.#dashboardService) {
      const direction = event.key.toLowerCase().replace('arrow', '');
      /* istanbul ignore else */
      if (
        direction === 'up' ||
        direction === 'down' ||
        direction === 'left' ||
        direction === 'right'
      ) {
        this.#dashboardService.moveTileOnKeyDown(
          this,
          direction,
          this.title
            ? this.title.nativeElement.innerText
            : /* istanbul ignore next */
              undefined,
        );
        this.#focusHandle();
      }
    }
  }

  #focusHandle(): void {
    this.grabHandle?.nativeElement.focus();
  }
}
