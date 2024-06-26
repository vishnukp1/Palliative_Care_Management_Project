const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  RegNo: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  mobile: {
    type: String,
    required: true,
  },
  disease: {
    type: String,
    required: true,
  },
  is_Active:{
    type: Number,
    default:1
  },
  addingDate: {
    type: Date,
    required: true,
  },
  DoctorName: {
    type: String,
    required: true,
  },
  MedicinesReceived:[{
      medicine:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required:true,
      },
      name:{type:String,required:true},
      count:{type:Number,required:true},
      recievedDate:{type:Date,required:true}
  }],
  Medicines: [
    {
      medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required: true,
      },
    },
  ],
  test_result: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'test', // Reference to the test result model
  }]
});

module.exports = mongoose.model("Patient", patientSchema);
