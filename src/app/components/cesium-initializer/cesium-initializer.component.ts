import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { IRange } from 'scicharts';

import { environment } from '../../../environments/environment';
import { ColorsService } from '../../services/colors/colors.service';
import { DatasetInitializerService } from '../../services/dataset-initializer/dataset-initializer.service';
import { InSituDataService } from '../../services/in-situ-data/in-situ-data.service';
import { LatisService } from '../../services/latis/latis.service';

/**
 * <cesium-initializer> component:
 * The creation and destruction of both the main and formation Cesium viewers.
 * The main viewer will always be present, but sometimes destroyed and recreated.
 * An example of this would be when the date is changed, as the whole viewer needs
 * to be destroyed in order to account for setting the new correct timeline for
 * both the main and formation viewers. This same process also decides when to
 * load/reload the <spacecraft-entity> and <mms-formation> components.
 *
 * This component is housed by the <app> component.
 * It houses the <spacecraft-entity> and <mms-formation> components.
 */
@Component({
    selector: 'app-cesium-initializer',
    templateUrl: './cesium-initializer.component.html',
    providers: [],
    styleUrls: [ './cesium-initializer.component.scss' ]
})
export class CesiumInitializerComponent implements OnInit {

    // Viewer variables will be assigned to Cesium Viewer when created
    viewer;
    formationViewer;
    selectedDates: IRange = this.latisService.currentDates;

    // Bools used to reload <spacecraft-entity> and <mms-formation> components
    loadSpacecraft = false;
    loadFormation = false;

    // Copies of control panel selections to determine if changes occur
    stored1dParamCopy = this.datasetInitializerService.stored1dParam;
    stored1dColorCopy = this.colorsService.stored1dColor;
    stored3dParamCopy = this.datasetInitializerService.stored3dParam;
    stored3dColorCopy = this.colorsService.stored3dColor;
    referenceFrameCopy = this.inSituDataService.referenceFrame;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private colorsService: ColorsService,
        private datasetInitializerService: DatasetInitializerService,
        private latisService: LatisService,
        private inSituDataService: InSituDataService
        ) {
        Cesium.BingMapsApi.defaultKey = environment.BING_KEY;
        this.createViewers( false, true );
    }

    /**
     * ngOnInit()
     * On initialization, the app subscribes to the values of the current date range,
     * the selected datasets, the selected color palettes, selected reference frame, and formation reload.
     * When any of these values change, this component will select the correct procedure to
     * reset the viewer, as to reduce loading times if only minimal changes
     * need to be made.
     */
    ngOnInit() {
        this.latisService.getSelectedDateRange$().subscribe( () => {
            if ( this.selectedDates !== this.latisService.currentDates ) {
                this.selectedDates = this.latisService.currentDates;
                this.dateChange();
            }
        });

        this.datasetInitializerService.getSelectedDatasets$().subscribe( () => {
            if ( this.stored1dParamCopy !== this.datasetInitializerService.stored1dParam ||
                    this.stored3dParamCopy !== this.datasetInitializerService.stored3dParam ) {
                this.stored1dParamCopy = this.datasetInitializerService.stored1dParam;
                this.stored3dParamCopy = this.datasetInitializerService.stored3dParam;
                this.dataChange();
            }
        });

        this.colorsService.getSelectedColors$().subscribe( () => {
            if ( this.stored1dColorCopy !== this.colorsService.stored1dColor ||
                    this.stored3dColorCopy !== this.colorsService.stored3dColor ) {
                this.stored1dColorCopy = this.colorsService.stored1dColor;
                this.stored3dColorCopy = this.colorsService.stored3dColor;
                this.dataChange();
            }
        });

        this.inSituDataService.getReferenceFrame$().subscribe( () => {
            if ( this.referenceFrameCopy !== this.inSituDataService.referenceFrame ) {
                this.dataChange();
            }
        });

        this.inSituDataService.getReloadFormation$().subscribe( ( val ) => {
            this.loadFormation = false;
            if ( val ) {
                this.changeDetector.detectChanges();
                if ( Cesium.defined( this.formationViewer ) ) {
                    this.formationViewer.destroy();
                }
                this.createViewers( true, false );
            }
        });
    }

    /**
     * createViewers()
     * Used to initialize the formation and main viewers.
     * We keep both of these in the same function due to the fact
     * the formation viewer heavily relies on time data from the main viewer,
     * so creating them together ensures the formation viewer will use
     * the correct Cesium timeline.
     */
    createViewers( createFormation: boolean, createMain: boolean ) {
        if ( createFormation ) {
            let viewerId = '';
            this.inSituDataService.onDesktop ?
                viewerId = 'formation-container' :
                viewerId = 'formation-container-mobile';

            const formationViewer = new Cesium.Viewer( viewerId, {
                sceneMode: Cesium.SceneMode.SCENE3D,
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                scene3dOnly: true
            });
            this.inSituDataService.formationViewer = formationViewer;
            this.formationViewer = formationViewer;

            const newGlobeEllipsoid = new Cesium.Ellipsoid( 0, 0, 0 );
            Cesium.Ellipsoid.clone( formationViewer.scene.globe.ellipsoid, newGlobeEllipsoid );
            const newGlobe = new Cesium.Globe( newGlobeEllipsoid );
            const bingImagery = new Cesium.BingMapsImageryProvider({
                url: 'https://dev.virtualearth.net',
                key: environment.BING_KEY,
                ellipsoid: newGlobeEllipsoid
            });
            newGlobe.imageryLayers.addImageryProvider( bingImagery );
            formationViewer.scene.globe = newGlobe;
        }

        if ( createMain ) {
            const startTime = Cesium.JulianDate.fromDate( this.selectedDates.start );
            const stopTime = Cesium.JulianDate.fromDate( this.selectedDates.end );
            const clockViewModel = new Cesium.ClockViewModel( new Cesium.Clock( {
                startTime:  startTime,
                stopTime: stopTime,
                currentTime: startTime,
                clockRange: Cesium.ClockRange.LOOP_STOP,
                multiplier: 2000
            }));

            const viewer = new Cesium.Viewer('cesium-container', {
                clockViewModel: clockViewModel,
                sceneMode: Cesium.SceneMode.SCENE3D,
                baseLayerPicker: false,
                fullscreenButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: false,
                sceneModePicker: false,
                selectionIndicator: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                scene3dOnly: true,
                shouldAnimate: true
            });
            this.inSituDataService.viewer = viewer;
            this.viewer = viewer;

            const newGlobeEllipsoid = new Cesium.Ellipsoid( 0, 0, 0 );
            Cesium.Ellipsoid.clone( viewer.scene.globe.ellipsoid, newGlobeEllipsoid );
            const newGlobe = new Cesium.Globe( newGlobeEllipsoid );
            const bingImagery = new Cesium.BingMapsImageryProvider({
                url: 'https://dev.virtualearth.net',
                key: environment.BING_KEY,
                ellipsoid: newGlobeEllipsoid
            });
            newGlobe.imageryLayers.addImageryProvider( bingImagery );
            viewer.scene.globe = newGlobe;

            // orbit path will always load in frame with the camera this distance from the Earth
            viewer.camera.position.y = 200000000;
            const timeInterval = new Cesium.TimeInterval({
                start: startTime,
                stop: stopTime
            });
            this.createInertialReferenceFrame( viewer, timeInterval );
        }
        if ( createFormation ) {
            // allows formation viewer's clock to be controlled by main timeline
            this.viewer.clock.onTick.addEventListener( ( clock, currentTime ) => {
                this.formationViewer.clock.currentTime = clock.currentTime;
                this.formationViewer.clock.onTick.raiseEvent( this.formationViewer.clock );
                this.formationViewer.resize();
                this.formationViewer.render();
            });
            this.loadFormation = true;
        }
        this.loadSpacecraft = true;
    }

    /**
     * createInertialReferenceFrame()
     * Used to set a newly created cesium viewer's reference frame to inertial.
     * Cesium's default creates the viewer in a planetary reference frame,
     * so this function rotates the camera on a newly computed matrix to simulate
     * an inertial reference frame.
     */
    createInertialReferenceFrame( viewer, timeInterval ) {
        if ( this.inSituDataService.referenceFrame === 'inertial' ) {
            const loadIcrf = Cesium.Transforms.preloadIcrfFixed( timeInterval );
            loadIcrf.then(() => {
                viewer.scene.postUpdate.addEventListener( function() {
                    if ( viewer.scene.mode !== Cesium.SceneMode.SCENE3D ) {
                        return;
                    }
                    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix( viewer.clock.currentTime );
                    if ( Cesium.defined( icrfToFixed ) ) {
                        const camera = viewer.camera;
                        const offset = Cesium.Cartesian3.clone( camera.position );
                        const transform = Cesium.Matrix4.fromRotationTranslation( icrfToFixed );
                        camera.lookAtTransform( transform, offset );
                    }
                });
            });
        }
    }

    /**
     * dateChange()
     * This function is called when the selected date range is changed.
     * It destroys the viewer and resets the spacecraft-entity component
     * as to reload all the spacecraft data in the new viewer
     */
    dateChange() {
        let visFormation = false;
        this.loadSpacecraft = false;
        if ( this.loadFormation ) {
            visFormation = true;
            this.loadFormation = false;
            this.changeDetector.detectChanges();
            this.formationViewer.destroy();
        }
        this.changeDetector.detectChanges();
        this.viewer.destroy();
        this.createViewers( visFormation, true );
    }

    /**
     * dataChange()
     * This function is called when either 1D or 3D parameter is changed,
     * or the selected reference frame is changed.
     *
     * We could potentially store these reloads in separate functions,
     * however since both parameters and reference changes are controlled through
     * the same reload button, we don't want multiple reloads/destructions of the viewer
     * after one call, so we're currently using this method.
     */
    dataChange() {
        const visFormation = this.loadFormation;
        this.loadSpacecraft = false;
        this.changeDetector.detectChanges();
        if ( this.referenceFrameCopy !== this.inSituDataService.referenceFrame ) {
            if ( visFormation ) {
                this.loadFormation = false;
                this.changeDetector.detectChanges();
                this.formationViewer.destroy();
            }
            this.viewer.destroy();
            this.referenceFrameCopy = this.inSituDataService.referenceFrame;
            this.createViewers( visFormation, true );
        } else {
            this.viewer.entities.removeAll();
            this.viewer.scene.primitives.removeAll();
            this.loadSpacecraft = true;
        }
    }
}
