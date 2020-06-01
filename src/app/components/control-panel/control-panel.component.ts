import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import * as moment from 'moment';

import { colormaps, mmsDatasets } from '../../models/index';
import { ColorsService } from '../../services/colors/colors.service';
import { DatasetInitializerService } from '../../services/dataset-initializer/dataset-initializer.service';
import { InSituDataService } from '../../services/in-situ-data/in-situ-data.service';
import { LatisService } from '../../services/latis/latis.service';


/**
 * <control-panel> component:
 * Organizes selected parameter and date options to be used by different
 * components throughout the application. Most changes are sent to separate
 * services or emitted directly to the <app> component.
 *
 * This component is housed by the <app> component
 */
@Component({
    selector: 'app-control-panel',
    templateUrl: './control-panel.component.html',
    styleUrls: [ './control-panel.component.scss' ]
})
export class ControlPanelComponent implements OnInit {
    @Output() plotButtonHit = new EventEmitter<boolean>();

    // Selection options for <mat-option> in <control-panel> html
    orbit1dParameters = mmsDatasets.ORBIT_COLOR_PARAMETERS;
    orbitWhiskerParameters = mmsDatasets.ORBIT_WHISKER_PARAMETERS;
    colorParameters = colormaps;

    availableDates = { start: '', end: '' };

    // Bools to disable specific buttons during reloads or before changes
    buttonDisabled = {
        viewer: true,
        date: true,
        override: false
    };

    // Form controls for <mat-select> instances in <control-panel> html
    dateDisplayed = new FormControl( moment( this.latisService.currentDates.end ) );
    dateDisplayedChecker = this.dateDisplayed.value.startOf( 'day' );
    referenceFrameSelected = new FormControl( this.inSituDataService.referenceFrame );
    orbit1dSelected = new FormControl( this.datasetInitializerService.stored1dParam );
    color1dSelected = new FormControl( this.colorsService.stored1dColor );
    orbitWhiskerSelected = new FormControl( this.datasetInitializerService.stored3dParam );
    color3dSelected = new FormControl( this.colorsService.stored3dColor );

    errorMessages: string[] = [];
    showError = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private colorsService: ColorsService,
        public datasetInitializerService: DatasetInitializerService,
        private latisService: LatisService,
        private inSituDataService: InSituDataService
    ) { }

    /**
     * ngOnInit()
     * Subscribes to the viewerReady variable in the <dataset-initializer>
     * service in order to determine when buttons should be disabled
     */
    ngOnInit() {
        this.availableDates = this.latisService.availableDates;

        this.datasetInitializerService.getViewerReady$().subscribe( viewerReady => {
            if ( viewerReady ) {
                this.buttonDisabled.override = false;
                this.enableDateChange();
                this.enableViewer();
                this.changeDetector.detectChanges();
            } else {
                this.buttonDisabled.viewer = true;
                this.buttonDisabled.date = true;
                this.buttonDisabled.override = true;
            }
        });
    }

    /**
     * checkDateValidity()
     * Called when the date-picker Reload button is hit.
     * Checks if a newly selected date is in the available date range.
     * Sends new date to the <latis> service if valid, which then
     * will reload all date dependent components in the app
     */
    checkDateValidity() {
        this.errorMessages = [];
        this.showError = false;
        let valid = true;
        const dateDisplayedNum = ( this.dateDisplayed.value.utc().unix() * 1000 ).toString();
        if ( dateDisplayedNum < this.availableDates.start ) {
            valid = false;
            this.showError = true;
            this.errorMessages.push( 'Date cannot be before min Available Date.' );
        }
        if ( dateDisplayedNum > this.availableDates.end ) {
            valid = false;
            this.showError = true;
            this.errorMessages.push( 'Date cannot be after max Available Date.' );
        }

        if ( valid ) {
            this.latisService.selectDates( this.dateDisplayed.value );
            this.dateDisplayedChecker = this.dateDisplayed.value;
            this.buttonDisabled.date = true;
        }
    }

    /**
     * enableViewer()
     * Called when any of the <mat-select> selections change.
     * Determines whether the viewer reload button should be disabled based
     * upon whether selected parameters have been actually changed or not.
     */
    enableViewer() {
        if ( !this.buttonDisabled.override ) {
            this.buttonDisabled.viewer = (
                ( this.referenceFrameSelected.value === this.inSituDataService.referenceFrame &&
                this.orbit1dSelected.value === this.datasetInitializerService.stored1dParam &&
                this.orbitWhiskerSelected.value === this.datasetInitializerService.stored3dParam ) &&
                ( this.color1dSelected.value === this.colorsService.stored1dColor ||
                    this.orbit1dSelected.value === '' ) &&
                ( this.color3dSelected.value === this.colorsService.stored3dColor ||
                    this.orbitWhiskerSelected.value === '' )
            );
        }
    }

    /**
     * enableDateChange()
     * Called when the <mat-datepicker> selected date changes.
     * Determines whether reload button should be disabled similar to enableViewer()
     */
    enableDateChange() {
        if ( !this.buttonDisabled.override ) {
            this.buttonDisabled.date = this.dateDisplayed.value.toDate().getTime() === this.dateDisplayedChecker.toDate().getTime();
        }
    }

    /**
     * displayChanges()
     * Called when viewer Reload button is hit.
     * Calls all relevant service functions and emits changes to send
     * variable changes to separate components
     */
    displayChanges() {
        if ( this.inSituDataService.referenceFrame !== this.referenceFrameSelected.value ) {
            this.inSituDataService.setReferenceFrame( this.referenceFrameSelected.value );
        }
        this.datasetInitializerService.setSelectedDatasets( this.orbit1dSelected.value, this.orbitWhiskerSelected.value);
        this.colorsService.setSelectedColors( this.color1dSelected.value, this.color3dSelected.value );
        this.plotButtonHit.emit( this.orbit1dSelected.value !== '' || this.orbitWhiskerSelected.value !== '' );
        this.buttonDisabled.viewer = true;
    }

}
