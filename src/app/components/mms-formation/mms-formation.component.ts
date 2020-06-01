import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';
import { Subscription } from 'rxjs';

import { IDateInfo } from '../../models/index';
import { DatasetInitializerService } from '../../services/dataset-initializer/dataset-initializer.service';
import { InSituDataService } from '../../services/in-situ-data/in-situ-data.service';
import { LatisService } from '../../services/latis/latis.service';

/**
 * <mms-formation> component:
 * All cesium entities and primitives found in the formation viewer
 * are loaded in this component. Each of the respective entities and
 * primitives are loaded using the ephemeris data found in the
 * <in-situ-data> service.
 *
 * This component is housed by the <cesium-initializer> component
 */
@Component({
    selector: 'app-mms-formation',
    templateUrl: './mms-formation.component.html',
    styleUrls: [ './mms-formation.component.scss' ]
})
export class MmsFormationComponent implements OnInit {

    currentDates = this.latisService.currentDates;
    selectedDates: IDateInfo = {
        start: moment( this.currentDates.start ).add( 1, 'days' ).format( 'YYYY-MM-DD' ),
        end: moment( this.currentDates.end ).add( 1, 'days' ).format( 'YYYY-MM-DD' )
    };

    // Cesium instances to be assigned when created for future reference
    formationViewer;
    spacecrafts = {
        mms1: {
            entity: new Cesium.Entity,
            primitive: new Cesium.Primitive
        },
        mms2: {
            entity: new Cesium.Entity,
            primitive: new Cesium.Primitive
        },
        mms3: {
            entity: new Cesium.Entity,
            primitive: new Cesium.Primitive
        },
        mms4: {
            entity: new Cesium.Entity,
            primitive: new Cesium.Primitive
        }
    };
    trackedEntity = new Cesium.Entity;

    ephemerisSubscription: Subscription;
    julianDates = [];

    constructor(
        private datasetInitializerService: DatasetInitializerService,
        private latisService: LatisService,
        private inSituDataService: InSituDataService
    ) { }

    /**
     * ngOnInit()
     * Determines if the ephemeris data (found in <in-situ-data> service)
     * has finished preloading and if not subscribes to determine when the
     * data does finish loading, then loads the cesium data
     */
    ngOnInit() {
        this.datasetInitializerService.formationReady.next( false );
        this.formationViewer = this.inSituDataService.formationViewer;
        if ( this.inSituDataService.eReadyBool ) {
            this.reloadData();
        } else {
            this.ephemerisSubscription = this.inSituDataService.getEphemerisReady$().subscribe( ( val ) => {
                if ( val ) {
                    this.reloadData();
                    this.ephemerisSubscription.unsubscribe();
                }
            });
        }
    }

    /**
     * reloadData()
     * The spacecraft entities and orbit path primitives are loaded based on the ephemeris data
     * provided by the <in-situ-data> service.
     * Sets event listener to determine when all primitives finish loading.
     */
    reloadData() {
        const gray = new Array<String>( 2880 ).fill( Cesium.Color.GRAY.withAlpha( 0.3 ) );
        Object.keys( this.spacecrafts ).forEach( ( key ) => {
            this.spacecrafts[ key ].entity = this.formationViewer.entities.add( new Cesium.Entity({
                position: this.inSituDataService.spacecrafts[ key ].transformed,
                model: {
                    uri: './assets/3dmodels/mms.glb',
                    minimumPixelSize: 40
                },
                viewFrom: new Cesium.Cartesian3( 0, 200000, 0 )
            }));
            this.spacecrafts[ key ].primitive = this.formationViewer.scene.primitives.add(
                new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: new Cesium.PolylineGeometry({
                            width: 1,
                            positions: this.inSituDataService.spacecrafts[ key ].positions,
                            colors: gray
                        })
                    }),
                    appearance: new Cesium.PolylineColorAppearance()
                })
            );
            if ( this.inSituDataService.referenceFrame === 'inertial' ) {
                this.rotateInertialPathData( this.spacecrafts[ key ].primitive );
            }
        });
        this.formationViewer.trackedEntityChanged.addEventListener( this.formationReady() );
        this.formationViewer.trackedEntity = this.spacecrafts.mms1.entity;
    }

    /**
     * formationReady()
     * Event listener referenced in reloadData(), will send to the
     * <dataset-initializer> service when the app has finished loading
     * to aid the loading icon in the <app> component
     */
    formationReady() {
        Promise.all([
            this.spacecrafts.mms1.primitive.readyPromise,
            this.spacecrafts.mms2.primitive.readyPromise,
            this.spacecrafts.mms3.primitive.readyPromise,
            this.spacecrafts.mms4.primitive.readyPromise
        ]).then( () => {
            this.datasetInitializerService.formationReady.next( true );
        });
        this.formationViewer.trackedEntityChanged.removeEventListener( this.formationReady );
    }

    /**
     * rotateInertialPathData()
     * Helper function referenced in reloadData() to rotate orbit path primitives
     */
    rotateInertialPathData( orbitPath ) {
        const clock = this.formationViewer.clock;
        const toInertial = new Cesium.Matrix3();
        let rotatingOrbitPath = new Cesium.Matrix4();
        clock.onTick.addEventListener( () => {
            if ( !Cesium.defined( Cesium.Transforms.computeIcrfToFixedMatrix( clock.currentTime, toInertial ))) {
                Cesium.Matrix3.IDENTITY.clone( toInertial );
            }
            rotatingOrbitPath = Cesium.Matrix4.fromRotationTranslation(
                toInertial,
                Cesium.Cartesian3.ZERO,
                rotatingOrbitPath
            );
            if ( orbitPath ) {
                rotatingOrbitPath.clone( orbitPath.modelMatrix );
            }
        });
    }
}
