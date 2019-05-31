/**
 * THIS IS WEATHER
 */


/**
 * Instantiate Vue app
 */
let vm = new Vue({
    el: '#vue_app',
    data: {
        search_term: '',
        osm_locations:[],
        selected_osm_location:null,
        nearest_station:undefined,
        latest_station_observations:undefined
    },
    methods:{

        reset_station: function(){
            this.selected_osm_location = undefined;
            this.nearest_station = undefined;
            this.latest_station_observations = undefined;
        },

        search: function (){

            this.reset_station();

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

            // get conditions for this area
            this.get_conditions();

        },

        get_conditions: function () {

            // init weather.gov API
            let wgov_client = new WeatherGovAPIClient();

            // query via lat/lon and get nearest station
            nearest_station_promise = wgov_client.select_nearest_station(
                this.selected_osm_location.lat, this.selected_osm_location.lon); // PROBLEM: too many numbers, redirecting, not cool for CORS

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