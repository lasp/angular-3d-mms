export const mmsDatasets = {
    EARTH_RADIUS_METERS: 6371000,
    ORBIT_COLOR_PARAMETERS: [
        {
            id: 'fpi_fast_ql_des',
            name: 'FPI Fast Ion Number Density',
            param: 'des_numberdensity_fast',
            units: 'cm^-3'
        },
        {
            id: 'hpca_srvy_l1b_moments',
            name: 'HPCA H+ Scalar Temperature',
            param: 'hpca_hplus_scalar_temperature',
            units: 'eV'
        },
        {
            id: 'hpca_srvy_l1b_moments_nd',
            name: 'HPCA H+ Number Density',
            param: 'hpca_hplus_number_density',
            units: 'cm^-3'
        }
    ],
    ORBIT_WHISKER_PARAMETERS: [
        {
            id: 'dfg_srvy_ql',
            name: 'Magnetic Field Vector',
            params: {
                x: 'Bx',
                y: 'By',
                z: 'Bz'
            },
            units: 'nT'
        },
        {
            id: 'fpi_fast_ql_des_bulkv_dbcs',
            name: 'Electron Bulk Velocity Vector',
            params: {
                x: 'Vx',
                y: 'Vy',
                z: 'Vz'
            },
            units: 'km/s'
        }
    ]
};

export const colormaps = [
    {
        name: 'Blue-Red',
        colormap: 'bluered',
        source: './assets/images/bluered.png'
    },
    {
        name: 'Cool',
        colormap: 'cool',
        source: './assets/images/cool.png'
    },
    {
        name: 'Inferno',
        colormap: 'inferno',
        source: './assets/images/inferno.png'
    },
    {
        name: 'Plasma',
        colormap: 'plasma',
        source: './assets/images/plasma.png'
    },
    {
        name: 'Spring',
        colormap: 'spring',
        source: './assets/images/spring.png'
    },
    {
        name: 'Viridis',
        colormap: 'viridis',
        source: './assets/images/viridis.png'
    }
];
