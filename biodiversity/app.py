import os
import pandas as pd
import numpy as np

# Python SQL toolkit and Object Relational Mapper
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

# Initialize Flask app
app = Flask(__name__)
# Turn off error tracking
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
#################################################
# Database Setup
#################################################
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///bellybutton.sqlite"
db = SQLAlchemy(app)

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(db.engine, reflect=True)

# Save references to each table
meta= Base.classes.sample_metadata
smpl = Base.classes.samples
#################################################

@app.route("/")
def index():
    """Return the homepage."""
    return render_template("index.html")

@app.route("/names")
def names():
    """Return a list of sample names."""
    # Use Pandas to perform the sql query
    stmt = db.session.query(smpl).statement
    smpl_df = pd.read_sql_query(stmt, db.session.bind)

    # Return a list of the column names (sample names)
    return jsonify(list(smpl_df.columns)[2:])
#---------------------------------------------------

@app.route("/metadata/<sample>")
def smpl_meta(sample):
    """Return the MetaData for a given sample."""
    sel_stmt = [
        meta.sample,
        meta.ETHNICITY,
        meta.GENDER,
        meta.AGE,
        meta.LOCATION,
        meta.BBTYPE,
        meta.WFREQ,
    ]

    results = db.session.query(*sel_stmt).filter(meta.sample == sample).all()
    print(results)
    # Create a dictionary entry for each row of metadata information
    metadata = {}
    for result in results:
        metadata["sample"] = result[0]
        metadata["ETHNICITY"] = result[1]
        metadata["GENDER"] = result[2]
        metadata["AGE"] = result[3]
        metadata["LOCATION"] = result[4]
        metadata["BBTYPE"] = result[5]
        metadata["WFREQ"] = result[6]

    return jsonify(metadata)
#---------------------------------------------------

@app.route("/samples/<sample>")
def samples(sample):
    """Return `otu_ids`, `otu_labels`,and `sample_values`."""
    stmt = db.session.query(smpl).statement
    smpl_df = pd.read_sql_query(stmt, db.session.bind)

    # Filter the data based on the sample number and
    # only keep rows with values above 1
    data = smpl_df.loc[smpl_df[sample] > 1, ["otu_id", "otu_label", sample]]
    # Format the data to send as json
    results = {
        "otu_ids": data.otu_id.values.tolist(),
        "sample_values": data[sample].values.tolist(),
        "otu_labels": data.otu_label.tolist(),
    }
    return jsonify(results)
#---------------------------------------------------

if __name__ == "__main__":
    app.run()
