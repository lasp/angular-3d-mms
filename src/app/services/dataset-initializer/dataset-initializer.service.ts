import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import { IDataset } from 'scicharts';

import { mmsDatasets } from '../../models/index';
import { LatisService } from '../latis/latis.service';

/**
 * <dataset-initializer> service:
 * Many different components and services rely on this service for checking what
 * datasets are currently selected, but also for changes with miscellaneous variables.
 * This service also formats data from the mmsDatasets constant (found in app/models)
 * for use by different components and services.
 */
@Injectable({
    providedIn: 'root'
})
export class DatasetInitializerService {

    viewerReady: Subject<boolean> = new Subject<boolean>();
    viewerReady$ = this.viewerReady.asObservable();
    formationReady: Subject<boolean> = new Subject<boolean>();
    formationReady$ = this.formationReady.asObservable();

    mmsPlotList: IDataset[] = [];
    overplotList: IDataset[] = [];
    selectedPlotList: [ IDataset[] ] = [ this.overplotList ];
    displayedPlots: Subject<[ IDataset[] ]> = new Subject<[ IDataset[] ]>();
    displayedPlots$ = this.displayedPlots.asObservable();

    showPlotButton = false;
    displayPlotButton: Subject<boolean> = new Subject<boolean>();
    displayPlotButton$ = this.displayPlotButton.asObservable();

    // Sets values to initial selection on control panel
    stored1dParam = '';
    stored3dParam = '';

    constructor( private latisService: LatisService ) {
        this.getAllDatasets();
    }

    /**
     * getAllDatasets()
     * Takes data from mmsDatasets constant and formats it for use by others
     * requesting it. In these formats also includes a LaTiS url that can be used
     * to call for the data itself.
     */
    getAllDatasets() {
        this.mmsPlotList = [];
        let mms = '';
        for (let i = 0; i < 4; i++) {
            mms = 'mms' + (i + 1);
            mmsDatasets.ORBIT_COLOR_PARAMETERS.forEach( orbitColorParameter => {
                this.mmsPlotList.push( {
                    url: this.latisService.getUrl( mms + '_' + orbitColorParameter.id, 'jsond', '', [] ),
                    name: mms + ' ' + orbitColorParameter.name,
                    desc: orbitColorParameter.param
                });
            });
            mmsDatasets.ORBIT_WHISKER_PARAMETERS.forEach( orbitWhiskerParameter => {
                const whiskerDataset = mms + '_' + orbitWhiskerParameter.id;
                this.mmsPlotList.push( {
                    url: this.latisService.getUrl(
                        whiskerDataset,
                        'jsond',
                        'time,' + orbitWhiskerParameter.params.x,
                        []
                        ),
                    name: mms + ' ' + orbitWhiskerParameter.name,
                    desc: orbitWhiskerParameter.params.x + ', '
                        + orbitWhiskerParameter.params.y + ', '
                        + orbitWhiskerParameter.params.z
                },
                    {
                        url: this.latisService.getUrl(
                    whiskerDataset,
                    'jsond',
                    'time,' + orbitWhiskerParameter.params.y,
                    []
                    ),
                        name: mms + ' ' + orbitWhiskerParameter.name,
                        desc: orbitWhiskerParameter.params.y
                    },
                    {
                        url: this.latisService.getUrl(
                    whiskerDataset,
                    'jsond',
                    'time,' + orbitWhiskerParameter.params.z,
                    []
                    ),
                        name: mms + ' ' + orbitWhiskerParameter.name,
                        desc: orbitWhiskerParameter.params.z
                    });
            });
        }
    }

    /**
     * reloadDatasets()
     * This is mainly used by the <scicharts> component for re-requesting
     * data post the selected date range changing
     */
    reloadDatasets() {
        this.setSelectedDatasets( this.stored1dParam, this.stored3dParam );
    }

    /**
     * setSelectedDatasets()
     * Using the dataset names selected from the control panel,
     * a new plot list is created containing all selected datasets and each
     * of their respective, formated data from the getAllDatasets() function
     */
    setSelectedDatasets( param1d: string, param3d: string ) {
        this.showPlotButton = param1d !== '' || param3d !== '';
        this.displayPlotButton.next( this.showPlotButton );
        this.stored1dParam = param1d;
        this.stored3dParam = param3d;
        this.overplotList = [];
        this.selectedPlotList = [ this.overplotList ];
        this.mmsPlotList.forEach( mmsPlot => {
            if ( mmsPlot.name.substring( 5 ) === param1d ) {
                this.selectedPlotList.push( [ mmsPlot ] );
            } else if ( mmsPlot.name.substring( 5 ) === param3d ) {
                this.overplotList.push( mmsPlot );
                if ( this.overplotList.length === 3 ) {
                    this.selectedPlotList.push( this.overplotList );
                    this.overplotList = [];
                }
            }
        });
        this.selectedPlotList.shift();
        this.displayedPlots.next( this.selectedPlotList );
    }

    /**
     * getSelectedDatasets$()
     * Observable used to get new plotlist
     * Used in <scicharts> component to access current plot list
     */
    getSelectedDatasets$(): Observable<[ IDataset[] ]> {
        return this.displayedPlots$;
    }

    /**
     * getShowPlotButton$()
     * Observable for whether the "Show Plots" button should be visible
     * Used by the <app> component
     */
    getShowPlotButton$(): Observable<boolean> {
        return this.displayPlotButton$;
    }

    /**
     * getViewerReady$()
     * Observable for whether the main viewer has finished loading
     */
    getViewerReady$(): Observable<boolean> {
        return this.viewerReady$;
    }

    /**
     * getFormationReady$()
     * Observable for whether the formation viewer has finished loading
     */
    getFormationReady$(): Observable<boolean> {
        return this.formationReady$;
    }
}
