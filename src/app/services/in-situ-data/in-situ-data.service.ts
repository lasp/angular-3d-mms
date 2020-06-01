import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { IEphemerisData, IPathColorData, IWhiskerData } from '../../models/index';
import { ColorsService } from '../colors/colors.service';
import { LatisService } from '../latis/latis.service';

/**
 * <in-situ-data> service:
 * All ephemeris data is pre-loaded in this service and formatted for use
 * by the componenets responsible for creating Cesium entities.
 * The majority of data handling from 1D and 3D parameter data also takes
 * place in this service.
 */
@Injectable({
    providedIn: 'root'
})
export class InSituDataService {

    // Set to cesium viewer in <cesium-initializer> component
    viewer;
    formationViewer;
    onDesktop: Boolean;

    referenceFrame = 'inertial';
    referenceFrames: Subject<String> = new Subject<String>();
    referenceFrame$ = this.referenceFrames.asObservable();
    reloadFormation: Subject<Boolean> = new Subject<Boolean>();
    reloadFormation$ = this.reloadFormation.asObservable();
    ephemerisReady: Subject<Boolean> = new Subject<Boolean>();
    ephemerisReady$ = this.ephemerisReady.asObservable();
    ephemerisData: IEphemerisData;
    eReadyBool = false;

    julianDates: String[] = [];
    orbitWhiskerCollection = new Cesium.PrimitiveCollection();

    spacecrafts = {
        mms1: {
            ephemeris: this.ephemerisData,
            transformed: new Cesium.SampledPositionProperty,
            positions: [],
            loaded: false
        },
        mms2: {
            ephemeris: this.ephemerisData,
            transformed: new Cesium.SampledPositionProperty,
            positions: [],
            loaded: false
        },
        mms3: {
            ephemeris: this.ephemerisData,
            transformed: new Cesium.SampledPositionProperty,
            positions: [],
            loaded: false
        },
        mms4: {
            ephemeris: this.ephemerisData,
            transformed: new Cesium.SampledPositionProperty,
            positions: [],
            loaded: false
        }
    };

    constructor(
        private colorsService: ColorsService,
        private latisService: LatisService
    ) {
        this.latisService.getSelectedDateRange$().subscribe( () => {
            this.getEphemerisData();
        });
        this.setReferenceFrame( this.referenceFrame );
        this.getEphemerisData();
    }

    /**
     * setReferenceFrame()
     * Sets new reference frame when called and re-transforms ephemeris data
     * to fit with new reference frame
     */
    setReferenceFrame( rf: string) {
        this.referenceFrame = rf;
        this.eReadyBool = false;
        this.ephemerisReady.next( false );
        this.referenceFrames.next( this.referenceFrame );
        Object.keys( this.spacecrafts ).forEach( ( key, index ) => {
            if ( this.referenceFrame === 'inertial' ) {
                this.spacecrafts[ key ].transformed = new Cesium.SampledPositionProperty( Cesium.ReferenceFrame.INERTIAL );
            } else {
                this.spacecrafts[ key ].transformed = new Cesium.SampledPositionProperty();
            }
            this.spacecrafts[ key ].loaded = false;
            if ( this.spacecrafts[ key ].ephemeris ) {
                Promise.resolve( this.transformEphemerisData( this.spacecrafts[ key ].ephemeris, index ) ).then( () => {
                    this.eReadyBool = true;
                    this.ephemerisReady.next( true );
                });
            }
        });
    }

    /**
     * getEphemerisDataHelper()
     * Helper function for getEphemerisData()
     * Used to check if all ephemeris data has been pre loaded,
     * and in turn Cesium entities can begin loading
     */
    getEphemerisDataHelper() {
        let test = true;
        Object.keys( this.spacecrafts ).forEach( ( key ) => {
            if ( !this.spacecrafts[ key ].loaded ) {
                test = false;
            }
        });
        if ( test ) {
            this.ephemerisReady.next( true );
            this.eReadyBool = true;
        }
    }

    /**
     * getEphemerisData()
     * Gets all 4 mms ephemeris datasets at start and transforms to fit
     * defined reference frame. Is called again when date is changed to grab
     * new data.
     */
    getEphemerisData() {
        this.eReadyBool = false;
        this.ephemerisReady.next( false );
        const mms1EphemerisUrl = this.latisService.getEphemerisUrl( 'mms1' );
        this.latisService.get( mms1EphemerisUrl ).subscribe( ( data: IEphemerisData ) => {
            this.spacecrafts.mms1.ephemeris = data;
            Promise.resolve( this.transformEphemerisData( data, 0 ) ).then( () => {
                this.spacecrafts.mms1.loaded = true;
                this.getEphemerisDataHelper();
            });
        });

        const mms2EphemerisUrl = this.latisService.getEphemerisUrl( 'mms2' );
        this.latisService.get( mms2EphemerisUrl ).subscribe( ( data: IEphemerisData ) => {
            this.spacecrafts.mms2.ephemeris = data;
            Promise.resolve( this.transformEphemerisData( data, 1 ) ).then( () => {
                this.spacecrafts.mms2.loaded = true;
                this.getEphemerisDataHelper();
            });
        });

        const mms3EphemerisUrl = this.latisService.getEphemerisUrl( 'mms3' );
        this.latisService.get( mms3EphemerisUrl ).subscribe( ( data: IEphemerisData ) => {
            this.spacecrafts.mms3.ephemeris = data;
            Promise.resolve( this.transformEphemerisData( data, 2 ) ).then( () => {
                this.spacecrafts.mms3.loaded = true;
                this.getEphemerisDataHelper();
            });
        });

        const mms4EphemerisUrl = this.latisService.getEphemerisUrl( 'mms4' );
        this.latisService.get( mms4EphemerisUrl ).subscribe( ( data: IEphemerisData ) => {
            this.spacecrafts.mms4.ephemeris = data;
            Promise.resolve( this.transformEphemerisData( data, 3 ) ).then( () => {
                this.spacecrafts.mms4.loaded = true;
                this.getEphemerisDataHelper();
            });
        });
    }

    /**
     * getReferenceFrame$()
     * Observable for detecting changes to the reference frame
     */
    getReferenceFrame$(): Observable<String> {
        return this.referenceFrame$;
    }

    /**
     * getReloadFormation$()
     * Observable for detecting the formation viewer needs to be reloaded
     */
    getReloadFormation$(): Observable<Boolean> {
        return this.reloadFormation$;
    }

    /**
     * getEphemerisReady$()
     * Observable for detecting the ephemeris data has finished loading
     */
    getEphemerisReady$(): Observable<Boolean> {
        return this.ephemerisReady$;
    }

    /**
     * transformEphemerisData()
     * Called while the ephemeris data is preloaded to convert the LaTiS
     * data to Cesium data objects to be used by Cesium entities and primitives.
     * This function also converts data based on reference frame
     */
    transformEphemerisData( data: IEphemerisData, scId: number ) {
        const isInertial = this.referenceFrame === 'inertial';
        const toInertial = new Cesium.Matrix3();
        let fromInertial = new Cesium.Matrix3();
        this.julianDates = [];
        const key = Object.keys( this.spacecrafts )[ scId ];
        this.spacecrafts[ key ].positions = [];

        /**
         * this constants data is an array with:
         * 0 being the specific data & time of the ephemeris position
         * 1 being the x coordinate of the ephemeris position
         * 2 being the y coordinate
         * 3 being the z coordinate
         */
        const latisOrbitData = data.mms_ephemeris.data;
        latisOrbitData.forEach( ( row: string ) => {
            const currentPosition = new Cesium.Cartesian3(
                +row[ 1 ] * 1000,
                +row[ 2 ] * 1000,
                +row[ 3 ] * 1000
            );
            const julianDate = Cesium.JulianDate.fromDate( new Date( row[ 0 ] ) );
            this.julianDates.push( julianDate );

            if ( !isInertial ) {
                if ( Cesium.defined(
                    Cesium.Transforms.computeFixedToIcrfMatrix( julianDate, toInertial )
                )) {
                    fromInertial = Cesium.Matrix3.transpose( toInertial, fromInertial );
                    Cesium.Matrix3.multiplyByVector( fromInertial, currentPosition, currentPosition );
                }
            }
            this.spacecrafts[ key ].transformed.addSample( julianDate, currentPosition );
            this.spacecrafts[ key ].positions.push( currentPosition );
        });
    }

    /**
     * transformWhiskerData()
     * This returns a Cesium PrimitiveCollection which holds a set of
     * 3D whisker vectors (formatted as Cesium Primitives) to be added to the
     * main viewer in the <spacecraft-entities> component. The primitive
     * collection is created using the 3D parameter data array passed as
     * a parameter.
     */
    transformWhiskerData( data: IWhiskerData, useMagFieldData: Boolean ) {
        const whiskerData = useMagFieldData ?
            data.mms1_dfg_srvy_ql.data :
            data.mms1_fpi_fast_ql_des_bulkv_dbcs.data;
        const vectors = [];
        whiskerData.forEach( ( row: string ) => {
            const julianDate = Cesium.JulianDate.fromDate( new Date( row[ 0 ] ) );
            const currentVector = new Cesium.Cartesian3(
                +row[ 1 ],
                +row[ 2 ],
                +row[ 3 ]
            );
            const mag = Cesium.Cartesian3.magnitude( currentVector );
            Cesium.Cartesian3.multiplyByScalar( currentVector, Math.log10( mag + 1) / mag, currentVector );
            vectors.push( [ julianDate, currentVector ] );
        });

        let minMag = Number.MAX_VALUE;
        let maxMag = -Number.MAX_VALUE;
        const magnitudes = vectors.map( ( row, index ) => {
            const vector = row[1];
            const mag = Cesium.Cartesian3.magnitude( vector );

            if ( mag < minMag ) { minMag = mag; }
            if ( mag > maxMag ) { maxMag = mag; }

            return mag;
        });

        const vectorColors = this.colorsService.interpolateArray( magnitudes, false );

        const interpolateWhiskerLength = ( magnitude, whiskerVector, result ) => {
            if ( magnitude === 0 ) {
                return Cesium.Cartesian3.clone( whiskerVector, result );
            } else {
                const interpolatedMagnitude =
                    ( magnitude - minMag ) /
                    ( maxMag - minMag ) *
                    10000000;

                return Cesium.Cartesian3.multiplyByScalar( whiskerVector, interpolatedMagnitude / magnitude, result );
            }
        };

        const toInertial = new Cesium.Matrix3();
        const fromInertial = new Cesium.Matrix3();
        this.orbitWhiskerCollection = new Cesium.PrimitiveCollection();
        vectors.forEach( ( row, index ) => {
            const julianDate = row[ 0 ];
            const vector = row[ 1 ];
            const magnitude = magnitudes[ index ];
            const orbitPos = this.spacecrafts.mms1.transformed.getValue( julianDate );
            const color = vectorColors[ index ];
            if ( orbitPos ) {
                if ( this.referenceFrame === 'inertial' ) {
                    if ( !Cesium.defined( Cesium.Transforms.computeIcrfToFixedMatrix( julianDate, toInertial) ) ) {
                        console.error( 'Failed to get inertial transform' );
                        return;
                    }
                    Cesium.Matrix3.transpose( toInertial, fromInertial );
                    Cesium.Matrix3.multiplyByVector( fromInertial, orbitPos, orbitPos );
                }

                const endPoint = new Cesium.Cartesian3();
                interpolateWhiskerLength( magnitude, vector, endPoint );
                Cesium.Cartesian3.add( orbitPos, endPoint, endPoint );

                this.orbitWhiskerCollection.add( new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: new Cesium.PolylineGeometry({
                            positions: [ orbitPos, endPoint ],
                            colors: [ color, color ],
                            width: 1,
                            arcType: Cesium.ArcType.NONE,
                            followSurface: false
                        })
                    }),
                    appearance: new Cesium.PolylineColorAppearance()
                }));
            }
        });
        return this.orbitWhiskerCollection;
    }

    /**
     * getParam1dData()
     * Takes an array from a LaTiS call to a 1d parameter dataset.
     * Finds out from what dataset this came from, and extracts the actual data values
     * from the object.
     * Fills in any values that don't exist, or fills in arrays that don't
     * have values for each orbit position
     */
    getParam1dData( data: IPathColorData ): String[] {
        let dataArray = new Array<String>( this.spacecrafts.mms1.positions.length );
        Object.keys( data ).forEach( key => dataArray = data[ key ].data );
        dataArray = dataArray.map( ( val ) => {
            return val[ 1 ];
        });
        if ( dataArray.length < this.spacecrafts.mms1.positions.length ) {
            return this.spacecrafts.mms1.positions.map( ( val, index ) => {
                return index < dataArray.length ?
                    dataArray[ index ] :
                    '';
            });
        } else {
            return dataArray;
        }
    }

}
