import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

/**
 * <colors> service:
 * All converted data from 1D and 3D parameters (chosen through the control panel)
 * will be sent to this service in order to represent the data as colors.
 * These colors will then be assigned either to the orbit path of the spacecraft
 * if the parameter is a 1D parameter, or the whisker vectors if the parameter
 * is a 3D parameter.
 */
@Injectable({
    providedIn: 'root'
})
export class ColorsService {

    gray = Cesium.Color.GRAY.withAlpha(0.7);
    stored1dColor = 'bluered';
    stored3dColor = 'bluered';
    storedColors: Subject<String> = new Subject<String>();
    storedColors$ = this.storedColors.asObservable();

    constructor() {}

    /**
     * interpolate()
     * Interpolates a value to a specific color given a color scheme.
     * Uses the given min and max values to determine the placement
     * of given value in array of data.
     */
    interpolate( x, min, max, colors ) {

        if ( typeof x === 'undefined' || x === null || isNaN( x ) || x === '' ) {
            return this.gray;
        }

        const val = ( x - min ) / ( max - min );
        const index = val * ( colors.length - 1 );
        if ( index % 1 === 0 ) {
            const colorVals = colors[ index ];
            return new Cesium.Color(
                colorVals[ 0 ],
                colorVals[ 1 ],
                colorVals[ 2 ],
                colorVals[ 3 ]
            );
        }

        const indexFloor = Math.floor( index );
        const indexCeil = Math.ceil( index );

        const valMin = indexFloor / colors.length;
        const valMax = indexCeil / colors.length;

        const colorArrayMin = colors[ indexFloor ];
        const colorArrayMax = colors[ indexCeil ];

        const colorArray = this.interpolateHelper( val, valMin, valMax, colorArrayMin, colorArrayMax );

        return new Cesium.Color(
            colorArray[ 0 ],
            colorArray[ 1 ],
            colorArray[ 2 ],
            colorArray[ 3 ]
        );
    }

    /**
     * interpolateHelper()
     * Takes non-integer index value and calculates best color selection
     * off given index value.
     * Returns a number array used to create a Cesium color
     */
    interpolateHelper( x, valMin, valMax, colorArrayMin, colorArrayMax ): Number[] {
        const colorArray = [];

        for ( let i = 0; i < 4; i++ ) {
            const val = ( x - valMin ) / ( valMax - valMin );
            colorArray.push( ( ( colorArrayMax[ i ] - colorArrayMin[ i ] ) * val ) + colorArrayMin[ i ] );
        }

        return colorArray;
    }

    /**
     * interpolateArray()
     * Takes an array of values and determines the min and max value in the array.
     * If all values are empty, returns an array of 'gray' values.
     * If there exist true values in the array, will interpolate each value
     * and return array with Cesium colors for each orbit position.
     */
    interpolateArray( array, color1d: Boolean ) {
        const colormap = require('colormap');
        // create colormap from selected color preference in control panel
        let colors;
        color1d ?
            colors = colormap({
                colormap: this.stored1dColor,
                nshades: 250,
                format: 'float'
            }) :
            colors = colormap({
                colormap: this.stored3dColor,
                nshades: 250,
                format: 'float'
            });

        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;

        array.forEach( val => {
            if ( val < min ) { min = val; }
            if ( val > max ) { max = val; }
        });
        // first tests if all the values are the same (aka our min max were never set)
        if ( min === Number.MAX_VALUE ) {
            array.fill( this.gray );
            return array;
        } else {
            return array.map( ( val ) => {
                return this.interpolate( val, min, max, colors );
            });
        }
    }

    /**
     * setSelectedColors$()
     * Used for telling other components the color values have changed
     */
    setSelectedColors( color1d: string, color3d: string) {
        this.stored1dColor = color1d;
        this.stored3dColor = color3d;
        this.storedColors.next( this.stored1dColor );
    }
    /**
     * getSelectedColors$()
     * Used for tracking when the stored color variables are changed
     */
    getSelectedColors$(): Observable<String> {
        return this.storedColors$;
    }
}
