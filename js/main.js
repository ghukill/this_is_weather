/**
 * THIS IS WEATHER
 */


/**
 * Instantiate Vue app
 */
let vm = new Vue({
    el: '#vue_app',
    data: {
        location: "ypsilanti, mi"
    }
});


/**
 * Client for weather.gov API
 */
class WeatherGovAPI {

    // API base url
    base_url = 'https://api.weather.gov/';

    // ping/pong API endpoint
    ping() {
        $.get( this.base_url, function( data ) {
            if (data.status === 'OK') {
                console.log('pong');
            }
            else {
                throw('did not receieve status of "OK" from weather.gov API');
            }
        });
    }

}


// instantiate instance
let wapi = new WeatherGovAPI();