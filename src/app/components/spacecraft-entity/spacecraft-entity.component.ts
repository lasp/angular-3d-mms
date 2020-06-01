import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';
import { Subscription } from 'rxjs';

import { IDateInfo, IPathColorData, IWhiskerData } from '../../models/index';
import { ColorsService } from '../../services/colors/colors.service';
import { DatasetInitializerService } from '../../services/dataset-initializer/dataset-initializer.service';
import { InSituDataService } from '../../services/in-situ-data/in-situ-data.service';
import { LatisService } from '../../services/latis/latis.service';

/**
 * <spacecraft-entity> component:
 * All Cesium entities and primitives (spacecrafts, orbit paths and whiskers)
 * are added to the main viewer in this component. The 1D and 3D parameters
 * chosen in the control panel are also handeled in this component.
 * Calculations for each of these parameters either take place in this component
 * or in helper functions found in the <in-situ-data> service
 *
 * This component is housed by the <cesium-initializer> component
 */
@Component({
    selector: 'app-spacecraft-entity',
    templateUrl: './spacecraft-entity.component.html',
    providers: [],
    styleUrls: [ './spacecraft-entity.component.scss' ]
})
export class SpacecraftEntityComponent implements OnInit {

    isInertial = this.inSituDataService.referenceFrame === 'inertial';
    currentDates = this.latisService.currentDates;
    selectedDates: IDateInfo = {
        start: moment( this.currentDates.start ).add( 1, 'days' ).format( 'YYYY-MM-DD' ),
        end: moment( this.currentDates.end ).add( 1, 'days' ).format( 'YYYY-MM-DD' )
    };

    orbitWhiskersCollection = new Cesium.PrimitiveCollection();
    orbitPathPrimitive = new Cesium.Primitive;
    orbitEntity = Cesium.Entity;
    viewer = this.inSituDataService.viewer;
    ephemerisSubscription: Subscription;
    // Initiliaze to 2880, the amount of orbit positions displayed in a 24 hour period
    param1dData: String[] = new Array<String>( 2880 );

    constructor(
        private colorService: ColorsService,
        public datasetInitializerService: DatasetInitializerService,
        private inSituDataService: InSituDataService,
        private latisService: LatisService
        ) {}

    /**
     * ngOnInit()
     * Tells the app the viewer is no longer ready and calls for the
     * Cesium properties to be loaded into the viewer.
     */
    ngOnInit() {
        this.datasetInitializerService.viewerReady.next( false );
        this.viewer = this.inSituDataService.viewer;
        this.initializeOrbitData();
    }

    /**
     * initializeOrbitDataHelper()
     * Helper function to initializeOrbitData to decide which sets
     * of data to load based on 1D and 3D parameters selected
     */
    initializeOrbitDataHelper() {
        if ( this.datasetInitializerService.stored3dParam !== '' ) {
            this.add3dWhiskers();
        }
        if ( this.datasetInitializerService.stored1dParam !== '') {
            this.add1dParam();
        } else {
            this.reloadData();
        }
    }

    /**
     * initializeOrbitData()
     * Calls helper function if ephemeris data has finished loading in
     * <in-situ-data> service. If not, subscribes and waits for data to finish loading
     */
    initializeOrbitData() {
        if ( this.inSituDataService.eReadyBool ) {
            this.initializeOrbitDataHelper();
        } else {
            this.ephemerisSubscription = this.inSituDataService.getEphemerisReady$().subscribe( ( val ) => {
                if ( val ) {
                    this.initializeOrbitDataHelper();
                    this.ephemerisSubscription.unsubscribe();
                }
            });
        }
    }

    /**
     * add1dParam()
     * Creates specific LaTiS url based on selected 1D parameter then
     * retrieves that data from LaTiS and sends it to a helper function in the
     * <in-situ-data> service
     */
    add1dParam() {
        let param1dUrl = '';
        if ( this.datasetInitializerService.stored1dParam === '' ) {
            this.param1dData = new Array<string>( this.inSituDataService.spacecrafts.mms1.positions.length );
        } else {
            const selectedDates = this.latisService.currentDates;
            const dateString = 'time>' + moment( selectedDates.start ).format( 'YYYY-MM-DD' )
                + '&time<' + moment( selectedDates.end ).format( 'YYYY-MM-DD' );

            const plotList = this.datasetInitializerService.mmsPlotList;
            for ( let i = 0; i < plotList.length; i++ ) {
                if ( plotList[ i ].name === 'mms1 ' + this.datasetInitializerService.stored1dParam ) {
                    param1dUrl = plotList[ i ].url + dateString;
                    break;
                }
            }
        }
        this.latisService.get( param1dUrl ).subscribe( ( data: IPathColorData ) => {
            this.param1dData = this.inSituDataService.getParam1dData( data );
            this.reloadData();
        });
    }

    /**
     * add3dWhiskers()
     * Creates specific LaTiS url based on selected 3D parameter then
     * retrieves that data from LaTiS and sends it to a helper function in
     * <in-situ-data> service. This returns a primitive collection to add to the viewer
     */
    add3dWhiskers() {
        const magFieldDataset = this.datasetInitializerService.stored3dParam === 'Magnetic Field Vector';
        const mms1WhiskerUrl =
            magFieldDataset ?
            this.latisService.getUrl(
                'mms1_dfg_srvy_ql',
                'jsond',
                'time,Bx,By,Bz',
                [ 'time>' + this.selectedDates.start, 'time<' + this.selectedDates.end ]
            ) :
            this.latisService.getUrl(
                'mms1_fpi_fast_ql_des_bulkv_dbcs',
                'jsond',
                'time,Vx,Vy,Vz',
                [ 'time>' + this.selectedDates.start, 'time<' + this.selectedDates.end ]
            );
        this.latisService.get( mms1WhiskerUrl ).subscribe( ( data: IWhiskerData ) => {
            this.orbitWhiskersCollection = this.inSituDataService.transformWhiskerData( data, magFieldDataset );
            this.viewer.scene.primitives.add( this.orbitWhiskersCollection );
        });
    }

    /**
     * reloadData()
     * Adds the spacecraft entity and orbit path primtives to the main viewer.
     * The camera will also adjust so that all entities and primitives are in
     * view of the camera after being added to the viewer.
     * The function will end by telling the <dataset-initializer> service
     * the primitive path has finished loading.
     */
    reloadData() {
        this.orbitEntity = this.viewer.entities.add( new Cesium.Entity({
            position: this.inSituDataService.spacecrafts.mms1.transformed,
            model: {
                uri: './assets/3dmodels/mms.glb',
                minimumPixelSize: 50
            }
        }));
        // positions camera to see all entities displayed
        const positions = this.inSituDataService.spacecrafts.mms1.positions;
        const currentPos = positions[ positions.length - 1 ];
        if ( currentPos ) {
            this.viewer.camera.flyTo( {
                destination: new Cesium.Cartesian3(
                    currentPos[ 'x' ],
                    350000000,
                    Math.abs( currentPos[ 'z' ] * 10 )
                )
            });
        }
        if ( Cesium.defined( this.viewer.primitives ) ) {
            this.viewer.primitives.removeAll();
        }
        const orbitPathPrimitive = this.viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: new Cesium.PolylineGeometry({
                        width: 4,
                        positions: positions,
                        colors: this.colorService.interpolateArray( this.param1dData, true )
                    })
                }),
                appearance: new Cesium.PolylineColorAppearance()
            })
        );
        this.orbitPathPrimitive = orbitPathPrimitive;

        if ( this.isInertial ) {
            this.rotateInertialPathData();
        }

        // Tells rest of the app when viewer fully loads
        const readyPromise = this.orbitPathPrimitive.readyPromise;
        readyPromise.then( () => {
            this.datasetInitializerService.viewerReady.next( true );
        });
    }

    /**
     * rotateInertialPathData()
     * Referenced in reloadData() to rotate newly created orbit path
     * primitives on an inertial reference frame.
     * Uses an event listener to adjust its position around a Cesium defined matrix
     */
    rotateInertialPathData() {
        const clock = this.viewer.clock;
        const toInertial = new Cesium.Matrix3();
        let rotatingOrbitPath = new Cesium.Matrix4();

        if ( this.isInertial ) {
            clock.onTick.addEventListener( () => {
                if ( !Cesium.defined( Cesium.Transforms.computeIcrfToFixedMatrix( clock.currentTime, toInertial ))) {
                    Cesium.Matrix3.IDENTITY.clone( toInertial );
                }
                rotatingOrbitPath = Cesium.Matrix4.fromRotationTranslation(
                    toInertial,
                    Cesium.Cartesian3.ZERO,
                    rotatingOrbitPath
                );

                if ( this.orbitPathPrimitive ) {
                    rotatingOrbitPath.clone( this.orbitPathPrimitive.modelMatrix );
                }

                if ( this.orbitWhiskersCollection ) {
                    const len = this.orbitWhiskersCollection.length;
                    for ( let i = 0; i < len; i++ ) {
                        const whiskerPrimitive = this.orbitWhiskersCollection.get(i);
                        rotatingOrbitPath.clone( whiskerPrimitive.modelMatrix );
                    }
                }
            });
        }
    }
}
