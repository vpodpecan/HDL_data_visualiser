# -*- coding: utf-8 -*-
"""
Created on Mon Mar  7 18:24:50 2016

@author: Vid Podpečan (vid.podpecan@ijs.si)
"""


from bottle import route, template, static_file, run, request, post, get, default_app, debug
from paste import httpserver
from paste.translogger import TransLogger

from os.path import join, dirname, exists
import sys
import argparse

import pandas as pd

basedir = join(dirname(__file__), 'static')
templatedir = join(dirname(__file__), 'templates')

logformat = ('%(REMOTE_ADDR)s [%(time)s] '
              '"%(REQUEST_METHOD)s %(REQUEST_URI)s %(HTTP_VERSION)s" '
              '%(status)s %(bytes)s "%(HTTP_REFERER)s" "%(HTTP_USER_AGENT)s"')

MAXROWS = 5000

# global variables which are instantiated on startup
store = None
names = None
sensornames = None


def load_globals(hdfname):
    global store, sensornames, names
    store = pd.HDFStore(hdfname)
    ks = [x.split('/')[1:] for x in store.keys()]
    names = {}
    for pat, sen in ks:
        if pat in names:
            names[pat].append(sen)
        else:
            names[pat] = [sen]

    sensornames = set()
    for pat in names:
        sensornames.update(names[pat])
    sensornames = sorted(list(sensornames))
# end


@route('/static/<filename:path>')
def send_static(filename):
    return static_file(filename, root=basedir)


@route('/')
def root():
    global sensornames, names
    return template(join(templatedir, 'index.htm'), data=names, sensors=sensornames)


@get('/getmeasurements')
@post('/getmeasurements')
def get_measurements():
    '''This function returns measurements (columns) names for a given sensor for a given patient'''

    global store
    if request.method == 'POST':
        data = request.POST
    elif request.method == 'GET':
        data = request.GET
    else:
        return {'status': False}

    patient = data.get('patient')
    sensor = data.get('sensor')
    if patient is None or sensor is None:
        return {'status': False, 'error': 'patient and sensor parameters must be present'}
    else:
        try:
            return {'status': True, 'measurements': list(store.get('/{}/{}'.format(patient, sensor)).columns)}
        except KeyError:
            return {'status': True, 'measurements': []}
#end



@get('/getdata')
@post('/getdata')
def get_data():
    '''This function returns data for in the given time frame for a specified patient, sensor and measurement (column)'''

    if request.method == 'POST':
        data = request.POST
    elif request.method == 'GET':
        data = request.GET
    else:
        return {}

    try:
        pname = data.get('pname')
        sensor = data.get('sensor')
        measurement = data.get('measurement')
        nsamples = int(data.get('nsamples', MAXROWS))
        fromdate = data.get('from', None)
        todate = data.get('to', None)

        if (pname is None or sensor is None or measurement is None):
            return {'status': False, 'error': 'pname, sensor and measurement parameters are mandatory'}

        print (pname, sensor, measurement, nsamples, fromdate, todate)

        if fromdate is not None:
            start = pd.datetime.fromtimestamp(int(fromdate)/1000)
        if todate is not None:
            end = pd.datetime.fromtimestamp(int(todate)/1000)

        # read the data
        data = store.get('/{}/{}'.format(pname, sensor))[measurement]
        # reindex to fill in the gaps
        data = data.reindex(pd.date_range(start=data.index[0], end=data.index[-1], freq='s'))
        if fromdate is None and todate is not None:
            data = data[:end]
        elif fromdate is not None and todate is None:
            data = data[start:]
        elif fromdate is not None and todate is not None:
            data = data[start:end]

        # limit the result set
        if len(data) > nsamples:
            data = data.sample(n=nsamples).sort_index()

        # make json data for column chart
        jsondata = []
        for t, val in data.iteritems():
            if pd.isnull(val):
                new = [int(t.timestamp()*1000), None]
            else:
                new = [int(t.timestamp()*1000), val]
            jsondata.append(new)

        return {'status': True, 'data': jsondata}
    except Exception as e:
        return {'status': False, 'error': str(e)}
#end


# only for development:
#debug(True)
#run(reloader=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument('-d', '--datafile', required=True, help='HDF5 store file')
    parser.add_argument('-p', '--port', default=8000, type=int, help='port for running the web server')
    args = parser.parse_args()

    if not exists(args.datafile.encode('utf-8')):
        print('Error: "{}" does not exist!'.format(args.datafile, file=sys.stderr))
        exit(1)
    try:
        _ = pd.HDFStore(args.datafile.encode('utf-8'))
    except:
        print('Error: "{}" is not a HDF5 store!'.format(args.datafile.encode('utf-8'), file=sys.stderr))
        exit(1)

    load_globals(args.datafile.encode('utf-8'))

    application = default_app()
    httpserver.serve(TransLogger(application, format=logformat), host='0.0.0.0', port=args.port)
