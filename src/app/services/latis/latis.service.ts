import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as moment from 'moment';
import { Cacheable } from 'ngx-cacheable';
import { Observable, Subject } from 'rxjs';
import { IRange } from 'scicharts';

import { environment } from '../../../environments/environment';
import { IDateInfo, IEphemerisData } from '../../models/index';

/**
 * <latis> service:
 * All LaTiS HTTP requests and URL's are handled through this service
 * The selected date range can also be changed through this service.
 * Both the LaTiS requests and date-range are handled through the same
 * service due to a circular dependency on one another.
 */
@Injectable({
    providedIn: 'root'
})
export class LatisService {

    initMoment = moment().utc().subtract( 2, 'days' ).startOf( 'day' );
    initDate = this.initMoment.format( 'yyyy-MM-dd' );
    availableDates: IDateInfo = { start: '', end: '' };
    currentDates: IRange = {
        start: this.initMoment.toDate(),
        end: this.initMoment.add( 1, 'days' ).toDate()
    };
    selectedDates: Subject<IRange> = new Subject<IRange>();
    selectedDates$ = this.selectedDates.asObservable();
    selectInitialized = false;

    selectedMoments = {
        start: moment( this.currentDates.start ).add( 1, 'days' ).format( 'YYYY-MM-DD' ),
        end: moment( this.currentDates.end ).add( 1, 'days' ).format( 'YYYY-MM-DD' )
    };

    constructor( private http: HttpClient ) {}

    /**
     * get()
     * Shorthand function for http.get() function
     */
    @Cacheable()
    get( url: string ) {
        return this.http.get( url );
    }

    /**
     * getUrl()
     * Converts given parameters to a proper LaTiS url with the HTTP base
     * defined in the current environment file being used
     */
    getUrl( dataset: string, suffix: string, projection: string, operations: string[] ): string {
        const temp = environment.LATIS_BASE + dataset + '.' + suffix + '?' + projection + '&' + operations.join( '&' );
        return temp;
    }

    /**
     * getEphemerisUrl()
     * Used to formulate a LaTiS url for the mms_ephemeris dataset call.
     * Takes a string to use as the spacecraft id for the Url
     */
    getEphemerisUrl( scId: string ): string {
        this.selectedMoments = {
            start: moment( this.currentDates.start ).add( 1, 'days' ).format( 'YYYY-MM-DD' ),
            end: moment( this.currentDates.end ).add( 1, 'days' ).format( 'YYYY-MM-DD' )
        };

        const mmsEphemerisUrl = this.getUrl(
            'mms_ephemeris',
            'jsond',
            'time,x,y,z',
            [ 'sc_id=' + scId, 'time>' + this.selectedMoments.start, 'time<' + this.selectedMoments.end ]
        );
        return mmsEphemerisUrl;
    }

    /**
     * setAvailableDateRange()
     * Used to find and set the available date range for LaTiS reqeusts.
     * This range is displayed in the control panel
     */
    setAvailableDateRange() {
        const firstUrl = this.getUrl(
            'mms_ephemeris', 'jsond', 'time', [ 'sc_id=mms1', 'exclude_missing()', 'first()' ] );
        this.get( firstUrl ).subscribe(( data: IEphemerisData ) => {
            const firstSeconds = data.mms_ephemeris.data[0];
            this.availableDates.start = firstSeconds[0].toString();
        });
        this.availableDates.end = ( this.initMoment.unix() * 1000 ).toString();
        if ( !this.selectInitialized ) {
            this.selectDates( this.initMoment.subtract( 1, 'day' ).toDate() );
        }
        return this.availableDates;
    }

    /**
     * selectDates()
     * Takes a date as a parameter and converts it to a moment range
     * to be used for formatting dataset calls
     */
    selectDates( dateSelected: Date ) {
        const tempDate = moment( dateSelected ).utc();
        const startOfDay = tempDate.startOf( 'day' ).toDate();
        const nextDay = tempDate.add( 1, 'days' ).toDate();
        this.currentDates = {
            start: startOfDay,
            end: nextDay
        };
        this.selectedDates.next( {
            start: startOfDay,
            end: nextDay
        });
    }

    /**
     * getSelectedDateRange()
     * Observable for detecting when the date range selected changes
     */
    getSelectedDateRange$(): Observable<IDateInfo> {
        return this.selectedDates$;
    }
}

