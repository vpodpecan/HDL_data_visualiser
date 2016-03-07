
### About

This is a web application for the visualisation of a large data set published in the challenge **Predicting Parkinson's Disease Progression with Smartphone Data**. Collection of this data was supported by the [Michael J. Fox Foundation](https://www.michaeljfox.org/page.html?access-parkinsons-clinical-data-and-biospecimens) and is available on [Kaggle](https://www.kaggle.com/c/predicting-parkinson-s-disease-progression-with-smartphone-data/data).

This project is related to my other project [HDL data parser](https://github.com/vpodpecan/HDL_data_parser) which is required to preprocess the data and save it into a HDF5 store. See the [HDL data parser readme](https://github.com/vpodpecan/HDL_data_parser/blob/master/README.md) for more information.

The aim of the visuliser is to enable quick and efficient visualisation of a large sensor data set. The data is loaded dynamically as you select and zoom in.


### Licence

This project uses [Highsoft's](http://www.highcharts.com/) software products ([Higstock](http://www.highcharts.com/products/highstock)) so the licencing terms apply. In general, non-commercial use is allowed for non-profit organisations, students, testing, etc. but it is not free for commercial and Governmental use. See [here](https://shop.highsoft.com/faq#Non-Commercial-0) for more information.


### How to use

1. First, you need [HDL data parser](https://github.com/vpodpecan/HDL_data_parser) and prepare the data. This will give you a ~7GB file.

2. Run the server. The following command will start the server on port 8000:

        python3 visualizer.py -d ../HDL_data_parser/output/hdl_data.h5

3. Visit [http://127.0.0.1:8000](http://127.0.0.1:8000) to visualise the data


### Requirements
In short, you need not-too-old versions of Python3, pandas, bottle, Paste and pytables (requires [HDF5](https://www.hdfgroup.org/HDF5/release/obtain5.html)). The code is known to work with:
* Python==3.4.1
* pandas==0.17.1
* tables==3.2.2
* bottle==0.12.9
* Paste==2.0.2
