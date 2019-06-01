/**
 * THIS IS WEATHER, 2
 *
 * TODO: handle 404 for missing stations
 */


/**
 * Instantiate Vue app
 */
let vm = new Vue({
    el: '#vue_app',
    data: {
        search_term: '',
        osm_locations:[],
        osm_location_disambiguate:false,
        selected_osm_location:null,
        lat:undefined,
        lon:undefined,
        nearest_station:undefined,
        latest_station_observations:undefined
    },
    methods:{

        use_current_location: function() {

            // get position
            var getPosition = function (options) {
                return new Promise(function (resolve, reject) {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });
            }

            getPosition()
                .then((position) => {

                    // set as null
                    vm.$data.selected_osm_location = {
                        display_name: "Current Location"
                    };

                    // set coords
                    vm.$data.lat = position.coords.latitude;
                    vm.$data.lon = position.coords.longitude;

                    // update conditions
                    vm.$root.get_conditions();

                })
                .catch((err) => {
                    console.error(err.message);
                });
        },

        search: function (){

            // turn on disambiguation window
            this.osm_location_disambiguate = true;

            // init OSM client and fire OSM nomination search
            let osm_client = new OSMNominationClient(this);
            osm_client.search_location(this.search_term)
                .then(function(data){
                    vm.$data.osm_locations = data;
                })

        },

        select_location: function (location){

            // set selected location
            this.selected_osm_location = location;

            // set latitude and longitude
            this.lat = location.lat;
            this.lon = location.lon;

            // get conditions for this area
            this.get_conditions();

        },

        get_conditions: function () {

            // init weather.gov API
            let wgov_client = new WeatherGovAPIClient();

            // query via lat/lon and get nearest station
            // PROBLEM: With 4+ decimal points, 301 redirect, debuggers cannot follow
            nearest_station_promise = wgov_client.select_nearest_station(
                this.lat, this.lon);

            // when done, do other stuff...
            nearest_station_promise.then(function(data){

                // set nearest station
                vm.$data.nearest_station = data;

                // get latest observations
                wgov_client
                    .get_latest_station_observations(data.properties.stationIdentifier)
                    .then(function(data){
                        vm.$data.latest_station_observations = data;
                    });

            })

        }
    }
});


/**
 * Client for weather.gov API
 *
 * API spec: https://www.weather.gov/documentation/services-web-api
 */
class WeatherGovAPIClient {

    // API base url
    base_url = 'https://api.weather.gov';

    /**
     * Select nearest station based on lat/lon coords     *
     * https://www.weather.gov/documentation/services-web-api#/default/get_points__point_
     */
    select_nearest_station(lat,lon) {

        /**
         * @return {promise} Promise containing nearest station
         */
        return $.get( `${this.base_url}/points/${lat},${lon}`)
            .then(function(data){

                // find nearest station and set to vm
                return $.get(data.properties.observationStations)
                    .then(function(stations_data) {
                        let nearest_station = stations_data.features[0];
                        return nearest_station;
                    });

            });
    }

    /**
     * Get latest observations for station
     * https://www.weather.gov/documentation/services-web-api#/default/get_stations__stationId__observations_latest
     */
    get_latest_station_observations(station_id) {

        return $.get(`${this.base_url}/stations/${station_id}/observations/latest`).then(function(data){
            return data;
        })

    }

}


/**
 * Client for OpenStreetMaps (OSM) Nomination tool
 *
 * API spec: https://nominatim.org/release-docs/develop/
 */
class OSMNominationClient {

    // API base url
    base_url = 'https://nominatim.openstreetmap.org/search/'

    // search_location
    search_location(search_term) {

        return $.get( `${this.base_url}/${search_term}?format=json`).then(function(data){
            return data;
        });

    }

}


