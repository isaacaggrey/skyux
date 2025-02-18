import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkyAppTestUtility, expect, expectAsync } from '@skyux-sdk/testing';
import {
  SkyTheme,
  SkyThemeMode,
  SkyThemeService,
  SkyThemeSettings,
  SkyThemeSettingsChange,
} from '@skyux/theme';

import { AgGridAngular } from 'ag-grid-angular';
import {
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  Column,
  ColumnApi,
  DetailGridInfo,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
  RowDataUpdatedEvent,
} from 'ag-grid-community';
import { BehaviorSubject, Subject } from 'rxjs';

import { SkyAgGridAdapterService } from './ag-grid-adapter.service';
import { SkyAgGridWrapperComponent } from './ag-grid-wrapper.component';
import {
  Editable,
  EnableTopScroll,
  SkyAgGridFixtureComponent,
} from './fixtures/ag-grid.component.fixture';
import { SkyAgGridFixtureModule } from './fixtures/ag-grid.module.fixture';
import { SecondInlineHelpComponent } from './fixtures/inline-help.component';

describe('SkyAgGridWrapperComponent', () => {
  let gridAdapterService: SkyAgGridAdapterService;
  let gridWrapperFixture: ComponentFixture<SkyAgGridWrapperComponent>;
  let gridWrapperComponent: SkyAgGridWrapperComponent;
  let gridWrapperNativeElement: HTMLElement;
  let mockThemeSvc: {
    settingsChange: BehaviorSubject<SkyThemeSettingsChange>;
  };

  let agGrid: AgGridAngular;

  beforeEach(() => {
    agGrid = {
      api: jasmine.createSpyObj<GridApi>('api', [
        'ensureColumnVisible',
        'forEachDetailGridInfo',
        'getEditingCells',
        'refreshCells',
        'resetRowHeights',
        'setFocusedCell',
        'setHeaderHeight',
        'stopEditing',
      ]),
      columnApi: new ColumnApi(),
      gridReady: new Subject<GridReadyEvent>(),
      rowDataUpdated: new Subject<RowDataUpdatedEvent>(),
      firstDataRendered: new Subject<FirstDataRenderedEvent>(),
      cellEditingStarted: new Subject<CellEditingStartedEvent>(),
      cellEditingStopped: new Subject<CellEditingStartedEvent>(),
    } as unknown as AgGridAngular;
    mockThemeSvc = {
      settingsChange: new BehaviorSubject<SkyThemeSettingsChange>({
        currentSettings: new SkyThemeSettings(
          SkyTheme.presets.default,
          SkyThemeMode.presets.light,
        ),
        previousSettings: undefined,
      }),
    };
    TestBed.configureTestingModule({
      imports: [SkyAgGridFixtureModule],
      providers: [
        {
          provide: SkyThemeService,
          useValue: mockThemeSvc,
        },
      ],
    });

    gridWrapperFixture = TestBed.createComponent(SkyAgGridWrapperComponent);
    gridAdapterService = TestBed.inject(SkyAgGridAdapterService);
    gridWrapperComponent = gridWrapperFixture.componentInstance;
    gridWrapperNativeElement = gridWrapperFixture.nativeElement;
    gridWrapperComponent.agGrid = agGrid;

    gridWrapperFixture.detectChanges();
  });

  it('should render a sky-ag-grid-wrapper element', () => {
    expect(gridWrapperNativeElement).toBeVisible();
  });

  it('should be accessible', async () => {
    await expectAsync(gridWrapperNativeElement).toBeAccessible();
  });

  it('should add .ag-header to the viewkeeper classes when the domLayout is set to autoHeight', () => {
    agGrid.gridOptions = { domLayout: 'autoHeight' };

    const autoHeightGridWrapperFixture = TestBed.createComponent(
      SkyAgGridWrapperComponent,
    );
    const autoHeightGridWrapperComponent =
      autoHeightGridWrapperFixture.componentInstance;
    autoHeightGridWrapperComponent.agGrid = agGrid;

    autoHeightGridWrapperFixture.detectChanges();

    expect(
      autoHeightGridWrapperComponent.viewkeeperClasses.indexOf('.ag-header'),
    ).not.toEqual(-1);
  });

  it('should add sky-ag-grid-layout-normal class when the domLayout is set to normal', () => {
    agGrid.gridOptions = { domLayout: 'normal' };

    const normalGridWrapperFixture = TestBed.createComponent(
      SkyAgGridWrapperComponent,
    );
    const autoHeightGridWrapperComponent =
      normalGridWrapperFixture.componentInstance;
    autoHeightGridWrapperComponent.agGrid = agGrid;

    normalGridWrapperFixture.detectChanges();

    expect(autoHeightGridWrapperComponent.isNormalLayout).toEqual(true);
  });

  it('should apply ag-theme', async () => {
    (agGrid.api.setHeaderHeight as jasmine.Spy).and.returnValue(undefined);
    (agGrid.api.resetRowHeights as jasmine.Spy).and.returnValue(undefined);
    (agGrid.api.refreshCells as jasmine.Spy).and.returnValue(undefined);
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('ag-theme-sky-data-grid-default');

    mockThemeSvc.settingsChange.next({
      currentSettings: new SkyThemeSettings(
        SkyTheme.presets.modern,
        SkyThemeMode.presets.light,
      ),
      previousSettings: undefined,
    });
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('ag-theme-sky-data-grid-modern-light');

    mockThemeSvc.settingsChange.next({
      currentSettings: new SkyThemeSettings(
        SkyTheme.presets.modern,
        SkyThemeMode.presets.dark,
      ),
      previousSettings: undefined,
    });
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('ag-theme-sky-data-grid-modern-dark');

    mockThemeSvc.settingsChange.next({
      currentSettings: new SkyThemeSettings(
        SkyTheme.presets.default,
        SkyThemeMode.presets.light,
      ),
      previousSettings: undefined,
    });
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('ag-theme-sky-data-grid-default');
  });

  it('should add and remove the cell editing class', () => {
    agGrid.cellEditingStarted.next({ colDef: {} } as CellEditingStartedEvent);
    agGrid.cellEditingStopped.next({} as CellEditingStoppedEvent);
    agGrid.cellEditingStarted.next({
      colDef: {
        type: 'test',
      },
    } as CellEditingStartedEvent);
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('sky-ag-grid-cell-editing-test');
    agGrid.cellEditingStopped.next({} as CellEditingStoppedEvent);
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).not.toHaveCssClass('sky-ag-grid-cell-editing-test');
    agGrid.cellEditingStarted.next({
      colDef: {
        type: ['test'],
      },
    } as CellEditingStartedEvent);
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).toHaveCssClass('sky-ag-grid-cell-editing-test');
    agGrid.cellEditingStopped.next({} as CellEditingStoppedEvent);
    gridWrapperFixture.detectChanges();
    expect(
      gridWrapperNativeElement.querySelector('.sky-ag-grid'),
    ).not.toHaveCssClass('sky-ag-grid-cell-editing-test');
  });

  describe('onGridKeydown', () => {
    let skyAgGridDivEl: HTMLElement;
    beforeEach(() => {
      skyAgGridDivEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.gridId}`,
      ) as HTMLElement;
    });

    function fireKeydownOnGrid(key: string, shiftKey: boolean): void {
      SkyAppTestUtility.fireDomEvent(skyAgGridDivEl, 'keydown', {
        keyboardEventInit: {
          key,
          shiftKey,
        },
      });

      gridWrapperFixture.detectChanges();
    }

    it('should not move focus when tab is pressed but cells are being edited', () => {
      const col = {} as Column;
      spyOn(gridAdapterService, 'setFocusedElementById');
      (agGrid.api.getEditingCells as jasmine.Spy).and.returnValue([
        { rowIndex: 0, column: col, rowPinned: undefined },
      ]);

      fireKeydownOnGrid('Tab', false);

      expect(gridAdapterService.setFocusedElementById).not.toHaveBeenCalled();
    });

    it('should not move focus when tab is pressed but master/detail cells are being edited', () => {
      const col = {} as Column;
      spyOn(gridAdapterService, 'setFocusedElementById');
      (agGrid.api.getEditingCells as jasmine.Spy).and.returnValue([]);
      (agGrid.api.forEachDetailGridInfo as jasmine.Spy).and.callFake((fn) => {
        fn(
          {
            api: {
              getEditingCells: (): any[] => {
                return [{ rowIndex: 0, column: col, rowPinned: '' }];
              },
            } as GridApi,
          } as DetailGridInfo,
          0,
        );
      });

      fireKeydownOnGrid('Tab', false);

      expect(gridAdapterService.setFocusedElementById).not.toHaveBeenCalled();
    });

    it('should not move focus when a non-tab key is pressed', () => {
      spyOn(gridAdapterService, 'setFocusedElementById');
      (agGrid.api.getEditingCells as jasmine.Spy).and.returnValue([]);

      fireKeydownOnGrid('L', false);

      expect(gridAdapterService.setFocusedElementById).not.toHaveBeenCalled();
    });

    it(`should move focus to the anchor after the grid when tab is pressed, no cells are being edited,
      and the grid was previously focused`, () => {
      (agGrid.api.getEditingCells as jasmine.Spy).and.returnValue([]);
      (agGrid.api.forEachDetailGridInfo as jasmine.Spy).and.callFake((fn) => {
        fn(
          {
            api: {
              getEditingCells: (): any[] => {
                return [];
              },
            } as GridApi,
          } as DetailGridInfo,
          0,
        );
      });
      spyOn(gridAdapterService, 'getFocusedElement').and.returnValue(
        skyAgGridDivEl,
      );
      spyOn(gridAdapterService, 'setFocusedElementById');

      fireKeydownOnGrid('Tab', false);

      expect(gridAdapterService.setFocusedElementById).toHaveBeenCalledWith(
        gridWrapperNativeElement,
        gridWrapperComponent.afterAnchorId,
      );
    });

    it(`should move focus to the anchor before the grid when shift + tab is pressed, no cells are being edited,
      and the grid was previous focused`, () => {
      (agGrid.api.getEditingCells as jasmine.Spy).and.returnValue([]);
      spyOn(gridAdapterService, 'getFocusedElement').and.returnValue(
        skyAgGridDivEl,
      );
      spyOn(gridAdapterService, 'setFocusedElementById');

      fireKeydownOnGrid('Tab', true);

      expect(gridAdapterService.setFocusedElementById).toHaveBeenCalledWith(
        gridWrapperNativeElement,
        gridWrapperComponent.beforeAnchorId,
      );
    });
  });

  describe('onKeyUpEscape', () => {
    let skyAgGridDivEl: HTMLElement;
    beforeEach(() => {
      skyAgGridDivEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.gridId}`,
      ) as HTMLElement;
    });

    function fireKeyupEscape(): void {
      SkyAppTestUtility.fireDomEvent(skyAgGridDivEl, 'keyup', {
        keyboardEventInit: {
          key: 'Escape',
        },
      });
      gridWrapperFixture.detectChanges();
    }

    it('should not move focus when tab is pressed but cells are being edited', () => {
      agGrid.api.stopEditing as jasmine.Spy;
      fireKeyupEscape();
      expect(agGrid.api.stopEditing).toHaveBeenCalled();
    });
  });

  describe('onAnchorFocus', () => {
    function focusOnAnchor(
      anchorEl: HTMLElement,
      previousFocusedEl: HTMLElement,
    ): void {
      SkyAppTestUtility.fireDomEvent(anchorEl, 'focusin', {
        customEventInit: {
          relatedTarget: previousFocusedEl,
        },
      });

      gridWrapperFixture.detectChanges();
    }

    it('should shift focus to the first grid cell if it was not the previously focused element and there is a cell', () => {
      const afterAnchorEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.afterAnchorId}`,
      ) as HTMLElement;
      const afterButtonEl = gridWrapperNativeElement.querySelector(
        '#button-after-grid',
      ) as HTMLElement;
      const column = new Column({}, {}, 'name', true);

      spyOn(agGrid.columnApi, 'getAllDisplayedColumns').and.returnValue([
        column,
      ]);
      (agGrid.api.ensureColumnVisible as jasmine.Spy).and.stub();

      focusOnAnchor(afterAnchorEl, afterButtonEl);

      expect(agGrid.api.ensureColumnVisible).toHaveBeenCalledWith(column);
    });

    it('should not shift focus to the first grid cell if there is no cell', () => {
      const afterAnchorEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.afterAnchorId}`,
      ) as HTMLElement;
      const afterButtonEl = gridWrapperNativeElement.querySelector(
        '#button-after-grid',
      ) as HTMLElement;
      const column = new Column({}, {}, 'name', true);

      spyOn(agGrid.columnApi, 'getAllDisplayedColumns').and.returnValue([
        column,
      ]);

      focusOnAnchor(afterAnchorEl, afterButtonEl);

      expect(agGrid.api.setFocusedCell).not.toHaveBeenCalled();
    });

    it('should not shift focus to the grid if it was the previously focused element', () => {
      const afterAnchorEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.afterAnchorId}`,
      ) as HTMLElement;
      const gridEl = gridWrapperNativeElement.querySelector(
        `#${gridWrapperComponent.gridId}`,
      ) as HTMLElement;
      spyOn(gridAdapterService, 'setFocusedElementById');

      focusOnAnchor(afterAnchorEl, gridEl);

      expect(gridAdapterService.setFocusedElementById).not.toHaveBeenCalled();
    });
  });
});

describe('SkyAgGridWrapperComponent via fixture', () => {
  let gridWrapperFixture: ComponentFixture<SkyAgGridFixtureComponent>;
  let gridWrapperNativeElement: HTMLElement;
  const getChildrenClassNames = () =>
    Array.from(
      gridWrapperNativeElement.querySelector('.ag-root')?.children || [],
    ).map((el) => el.classList[0]);

  it('should move the horizontal scroll based on enableTopScroll check, static data', async () => {
    TestBed.configureTestingModule({
      imports: [SkyAgGridFixtureModule],
      providers: [
        {
          provide: EnableTopScroll,
          useValue: true,
        },
      ],
    });
    gridWrapperFixture = TestBed.createComponent(SkyAgGridFixtureComponent);
    gridWrapperNativeElement = gridWrapperFixture.nativeElement;

    gridWrapperFixture.detectChanges();
    await gridWrapperFixture.whenStable();

    // Expect the scrollbar at the bottom.
    expect(getChildrenClassNames()).toEqual([
      'ag-header',
      'ag-body-horizontal-scroll',
      'ag-floating-top',
      'ag-body',
      'ag-sticky-top',
      'ag-floating-bottom',
      'ag-overlay',
    ]);
  });

  it('should move the horizontal scroll based on enableTopScroll check, async loading', async () => {
    TestBed.configureTestingModule({
      imports: [SkyAgGridFixtureModule],
    });
    gridWrapperFixture = TestBed.createComponent(SkyAgGridFixtureComponent);
    gridWrapperNativeElement = gridWrapperFixture.nativeElement;

    gridWrapperFixture.detectChanges();
    await gridWrapperFixture.whenStable();

    // Expect the scrollbar at the bottom.
    expect(getChildrenClassNames()).toEqual([
      'ag-header',
      'ag-floating-top',
      'ag-body',
      'ag-sticky-top',
      'ag-floating-bottom',
      'ag-body-horizontal-scroll',
      'ag-overlay',
    ]);

    gridWrapperFixture.componentInstance.gridOptions.context = {
      enableTopScroll: true,
    };
    gridWrapperFixture.componentInstance.agGrid?.gridReady.emit();

    // Expect the scrollbar below the header.
    expect(getChildrenClassNames()).toEqual([
      'ag-header',
      'ag-body-horizontal-scroll',
      'ag-floating-top',
      'ag-body',
      'ag-sticky-top',
      'ag-floating-bottom',
      'ag-overlay',
    ]);

    gridWrapperFixture.componentInstance.gridOptions.context = {
      enableTopScroll: false,
    };
    gridWrapperFixture.componentInstance.agGrid?.rowDataUpdated.emit();

    // Expect the scrollbar at the bottom.
    expect(getChildrenClassNames()).toEqual([
      'ag-header',
      'ag-floating-top',
      'ag-body',
      'ag-sticky-top',
      'ag-floating-bottom',
      'ag-body-horizontal-scroll',
      'ag-overlay',
    ]);
  });

  it('should show inline help', async () => {
    TestBed.configureTestingModule({
      imports: [SkyAgGridFixtureModule],
    });
    gridWrapperFixture = TestBed.createComponent(SkyAgGridFixtureComponent);
    gridWrapperNativeElement = gridWrapperFixture.nativeElement;

    gridWrapperFixture.detectChanges();
    await gridWrapperFixture.whenStable();

    expect(
      gridWrapperNativeElement.querySelector(
        `[col-id="name"] .sky-control-help`,
      ),
    ).toBeTruthy();
    expect(
      gridWrapperNativeElement.querySelector(
        `[col-id="value"] .sky-control-help`,
      ),
    ).toBeTruthy();
    expect(
      gridWrapperNativeElement
        .querySelector(`[col-id="value"] .sky-control-help`)
        ?.getAttribute('title'),
    ).toEqual('Current Value help');

    gridWrapperFixture.componentInstance.agGrid?.api.setColumnDefs([
      ...gridWrapperFixture.componentInstance.columnDefs.map((col) => {
        switch (col.field) {
          case 'name':
            return {
              ...col,
              headerComponentParams: {
                ...col.headerComponentParams,
                inlineHelpComponent: undefined,
              },
            };
          case 'value':
            return {
              ...col,
              headerComponentParams: {
                ...col.headerComponentParams,
                inlineHelpComponent: SecondInlineHelpComponent,
              },
            };
          case 'target':
            return {
              ...col,
              hide: true,
            };
          default:
            return col;
        }
      }),
    ]);
    gridWrapperFixture.detectChanges();
    await gridWrapperFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(
      gridWrapperNativeElement.querySelector(
        `[col-id="name"] .sky-control-help`,
      ),
    ).toBeFalsy();
    expect(
      gridWrapperNativeElement.querySelector(
        `[col-id="value"] .sky-control-help`,
      ),
    ).toBeTruthy();
    expect(
      gridWrapperNativeElement
        .querySelector(`[col-id="value"] .sky-control-help`)
        ?.getAttribute('title'),
    ).toEqual('Current Value help replaced');
  });

  describe('accessibility', () => {
    [false, true].forEach((enableTopScroll) => {
      it(`should be accessible in view mode ${
        enableTopScroll ? 'with' : 'without'
      } top scroll`, async () => {
        TestBed.configureTestingModule({
          imports: [SkyAgGridFixtureModule],
          providers: [
            {
              provide: Editable,
              useValue: false,
            },
            {
              provide: EnableTopScroll,
              useValue: enableTopScroll,
            },
          ],
        });
        gridWrapperFixture = TestBed.createComponent(SkyAgGridFixtureComponent);
        gridWrapperNativeElement = gridWrapperFixture.nativeElement;

        gridWrapperFixture.detectChanges();
        await gridWrapperFixture.whenStable();

        await expectAsync(gridWrapperNativeElement).toBeAccessible();
      });
    });

    it(`should be accessible in edit mode`, async () => {
      TestBed.configureTestingModule({
        imports: [SkyAgGridFixtureModule],
        providers: [
          {
            provide: Editable,
            useValue: true,
          },
          {
            provide: EnableTopScroll,
            useValue: false,
          },
        ],
      });
      gridWrapperFixture = TestBed.createComponent(SkyAgGridFixtureComponent);
      gridWrapperNativeElement = gridWrapperFixture.nativeElement;

      gridWrapperFixture.detectChanges();
      await gridWrapperFixture.whenStable();

      await expectAsync(gridWrapperNativeElement).toBeAccessible();

      gridWrapperFixture.componentInstance.agGrid?.api.startEditingCell({
        rowIndex: 0,
        colKey: 'lookupSingle',
      });
      gridWrapperFixture.detectChanges();
      await gridWrapperFixture.whenStable();
      await expectAsync(gridWrapperNativeElement).toBeAccessible();

      gridWrapperFixture.componentInstance.agGrid?.api.stopEditing();
      gridWrapperFixture.detectChanges();
      await gridWrapperFixture.whenStable();

      gridWrapperFixture.componentInstance.agGrid?.api.startEditingCell({
        rowIndex: 0,
        colKey: 'lookupMultiple',
      });
      gridWrapperFixture.detectChanges();
      await gridWrapperFixture.whenStable();
      await expectAsync(
        gridWrapperNativeElement.ownerDocument.body,
      ).toBeAccessible({
        rules: {
          region: {
            enabled: false,
          },
        },
      });
    });
  });
});
