import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';
import { DEFAULT_UI_OPTIONS, IDataset, IRange, IUIFeatures } from 'scicharts';

import { IPlotItem } from '../../models';
import { DatasetInitializerService } from '../../services/dataset-initializer/dataset-initializer.service';
import { LatisService } from '../../services/latis/latis.service';

/**
 * <scicharts> component:
 * Formats the selected datasets and time range to be plotted by the
 * <sci-charts> module in the html file.
 *
 * This component is housed in the <app> component
 */
@Component({
    selector: 'app-scicharts',
    templateUrl: './scicharts.component.html',
    styleUrls: [ './scicharts.component.scss' ]
})
export class ScichartsComponent implements OnInit {

    plotList: IPlotItem[] = [ { datasets: [] } ];
    allDatasets: IDataset[] = [];
    range: IRange = {
        start: moment().utc().startOf( 'day' ).subtract( 2, 'days' ).toDate(),
        end: moment().utc().startOf( 'day' ).subtract( 1, 'day' ).toDate()
    };

    SCICHARTS_PRESET: IUIFeatures = {
        featureList: DEFAULT_UI_OPTIONS.features.featureList,
        toolbar: true,
        filters: false,
        metadata: true,
        download: true,
        globalSettings: false,
        overplot: true,
        limits: false,
        events: false,
        binnedData: false,
        discreteData: false,
        rangeSelector: false,
        collapsible: true,
        modifyDatasetsButton: false
    };
    uiOptions = DEFAULT_UI_OPTIONS;

    constructor(
        private datasetInitializerService: DatasetInitializerService,
        private latisService: LatisService
        ) {
        this.uiOptions.features = this.SCICHARTS_PRESET;
    }

    /**
     * ngOnInit()
     * Calls for range and datasets to be initialized
     */
    ngOnInit() {
        this.rangeSelector();
        this.datasetSelector();
    }

    /**
     * rangeSelector()
     * Subscribes to <latis> service date range to get values and detect changes
     */
    rangeSelector() {
        this.latisService.getSelectedDateRange$().subscribe( selectedDateRange => {
            this.range = {
                start: selectedDateRange.start,
                end: selectedDateRange.end
            };
            this.datasetInitializerService.reloadDatasets();
        });
    }

    /**
     * datasetSelector()
     * Subscribes to plot list in <dataset-initializer> service to get plots and detect changes
     */
    datasetSelector() {
        this.datasetInitializerService.getSelectedDatasets$().subscribe( selectedPlots => {
            this.plotList = [];
            selectedPlots.forEach( selectedPlot => {
                this.plotList.push( { datasets: selectedPlot } );
            });
        });
    }
}
