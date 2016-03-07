var charttype = 'column';
var charts = new Array();
var spinoptsSmall = {
    lines: 17 // The number of lines to draw
        ,
    length: 8 // The length of each line
        ,
    width: 3 // The line thickness
        ,
    radius: 14 // The radius of the inner circle
        ,
    scale: 0.75 // Scales overall size of the spinner
        ,
    corners: 1 // Corner roundness (0..1)
        ,
    color: '#000' // #rgb or #rrggbb or array of colors
        ,
    opacity: 0.1 // Opacity of the lines
        ,
    rotate: 0 // The rotation offset
        ,
    direction: 1 // 1: clockwise, -1: counterclockwise
        ,
    speed: 0.6 // Rounds per second
        ,
    trail: 75 // Afterglow percentage
        ,
    fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        ,
    zIndex: 2e9 // The z-index (defaults to 2000000000)
        ,
    className: 'spinner' // The CSS class to assign to the spinner
        ,
    top: '100%' // Top position relative to parent
        ,
    left: '50%' // Left position relative to parent
        ,
    shadow: false // Whether to render a shadow
        ,
    hwaccel: false // Whether to use hardware acceleration
        ,
    position: 'absolute' // Element positioning
};


function sendData(url, postdata, successFn, failureFn) {
    $.when(
        $.ajax({
            type: "POST",
            url: url,
            data: postdata,
            dataType: "json"
        }).then(function(result) {
            if (typeof successFn !== 'undefined')
                successFn(result);
            else {
                if (result.status) {
                    //location.reload(true);
                }
                else
                    console.log(result.error);
            }
        }, function(xhr, textStatus, errorThrown) {
            if (typeof failureFn != 'undefined')
                failureFn(xhr, textStatus, errorThrown);
            else
                console.log('Server error.\nPlease report the incident to vid.podpecan@ijs.si.\n' + 'Error message: "' + textStatus);
        })
    )
};


function makeChart(nick, sensor, measurement, renderto) {
    var newchart;
    sendData('/getdata', {
            pname: nick,
            sensor: sensor,
            measurement: measurement,
            nsamples: parseInt($('#samplerate').val().trim()),
        },
        function(result) {
            if (!result.status) {
                alert(result.error);
            } else {
                var data = result.data;
                newchart = new Highcharts.StockChart({
                    chart: {
                        renderTo: renderto,
                        type: charttype,
                        zoomType: 'x',
                    },

                    navigator: {
                        adaptToUpdatedData: false,
                        series: {
                            data: data
                        }
                    },

                    tooltip: {
                        enabled: false
                    },

                    scrollbar: {
                        liveRedraw: false
                    },

                    title: {
                        text: nick + ' ' + sensor
                    },

                    subtitle: {
                        text: measurement
                    },

                    rangeSelector: {
                        //                enabled: false,
                        buttons: [{
                            type: 'all',
                            text: 'All'
                        }],
                        inputEnabled: false // it supports only days
                            //                selected : 4 // all
                    },

                    xAxis: {
                        gridLineWidth: 1,
                        events: {
                            afterSetExtremes: function(e) {
                                var chart = $(renderto).highcharts();
                                var lb = new Date(e.min);
                                var ub = new Date(e.max);
                                //        console.log(lb, ub);

                                chart.showLoading('Loading data from server...');

                                sendData('/getdata', {
                                    pname: nick,
                                    sensor: sensor,
                                    measurement: measurement,
                                    nsamples: parseInt($('#samplerate').val().trim()),
                                    from: new Date(e.min).getTime(),
                                    to: new Date(e.max).getTime()
                                }, function(result) {

                                    if (!result.status) {
                                        console.log(result.error);
                                        return
                                    }
                                    var data = result.data;
                                    chart.series[0].setData(data);
                                    chart.hideLoading();
                                });
                            }
                        }
                    },

                    series: [{
                        data: data,
                        dataGrouping: {
                            enabled: false
                        }
                    }]

                });
            }
        }
    );

    return newchart;
}

function clearAll() {
    $('.highchart').remove();
    charts = new Array();
}


$(document).ready(function() {
    $(document).ajaxStart(function() {
            $('#spinner').spin(spinoptsSmall)
        })
        .ajaxStop(function() {
            $('#spinner').spin(false)
        });

    $('#clearbtn').click(clearAll);

    $('#patientnick,#sensorname').on('change', function() {
        var patient = $('#patientnick').val().trim();
        var sensor = $('#sensorname').val().trim();
        if (patient && sensor) {
            sendData('/getmeasurements', {
                    patient: patient,
                    sensor: sensor
                },
                function(result) {
                    if (!result.status) {
                        console.log(result.error);
                        return
                    } else {
                        $('#measurements').empty();
                        $(result.measurements).each(function(i, elt) {
                            $('#measurements').append('<div class="checkbox"> <label> <input type="checkbox">' + elt + '</label> </div>');
                        });
                    }
                }
            )
        }
    });

    $('#showbtn').on('click', function() {
        var selected = new Array;
        $('#measurements').children().each(function(i, elt) {
            if ($(elt).find('input').prop('checked')) {
                selected.push($(elt).find('label').text().trim());
            }
        });

        if (selected.length < 1)
            return;

        clearAll()

        //make new
        $(selected).each(function(i, elt) {
            var patient = $('#patientnick').val().trim();
            var sensor = $('#sensorname').val().trim();
            var measurement = elt;

            $('#datacol').append('<div class="highchart" id="' + measurement + '"></div>');
            var chart = makeChart(patient, sensor, measurement, document.getElementById(measurement));
            charts.push(chart);
        });
    })
});