var googleKey = config.GOOGLE_KEY;
// Função para carregamento assíncrono
window.addEventListener('load',function(){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key='+googleKey+'&v=3&callback=initMap';
    document.body.appendChild(script);
});

var map;
// função para carregar o mapa
// função chamada pelo script abaixo para carregar api
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    // criar uma instancia de novo mapa
    // define pela id onde vai aparecer no html
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -19.925382, lng: -43.942943},
        zoom: 15
    });
}
