const User = require("../models/userModel");
const Patient = require("../models/patientModel");
const Medicine = require("../models/medicineModel");
const bcrypt = require("bcrypt");
const MedicineDistribution =require('../models/MdcnDstrbtionModel')



module.exports = {
loadLogin:(req, res) => {
  res.render("doctor/login", { error: null, message: null });
},

securePassword :async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
},

  DoctorLogin: async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.render("doctor/login", {
        message: null,
        error: "User not found.",
      });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.render("users/login", {
        error: "Wrong password.",
        message: null,
      });
    if (user.is_Admin === 1) {
      req.session.doctor = user._id;
      res.redirect("/doctor/dashboard");
    } else {
      res.redirect("/login?error=" + encodeURIComponent("You are not Doctor"));
    }
  } catch (error) {
    console.log(error.message);
  }
},


dashboard : async (req, res) => {
  const { q } = req.query;
  try {
    let users;
    if (q && q.length > 0) {
      users = await User.find({
        name: { $regex: ".*" + q + ".*" },
        is_Admin: 0,
      });
    } else {
      users = await User.find({ is_Admin: 0 });
    }
    res.render("doctor/dashboard", { users, q });
  } catch (error) {
    console.log(error.message);
  }
},

loadEditUser : async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.render("doctor/editUser", { user });
  } catch (error) {
    console.log(error);
  }
},

 updateUser : async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, is_varified } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          email,
          mobile,
          is_varified,
        },
      },
      { new: true }
    );
    res.redirect("/doctor/dashboard");
  } catch (error) {
    console.log(error);
  }
},

 deleteUser : async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOneAndDelete({ _id: id });
    if (req.session.user_session === user._id) {
      req.session.destroy();
    }
    return res.redirect("/doctor/dashboard");
  } catch (error) {
    console.log(error.message);
  }
},

DoctorAddUser : async (req, res) => {
  try {
    res.render("doctor/createUser", { error: null, message: null });
  } catch (error) {
    console.log(error.message);
  }
},

logoutDoctor:(req, res) => {
  req.session.destroy();
  res.redirect("/doctor/login");
},

 createUser : async (req, res) => {
  const { name, email, password, mobile, is_varified } = req.body;
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  try {
    if (!email)
      return res.render("doctor/createUser", { error: "Email is required" });
    if (!emailRegex.test(email))
      return res.render("doctor/user_new", {
        error: "Email must be a valid email!",
      });
      if(password<6){
        return res.render("doctor/createUser", {
          message: null,
          error: "password must be atleast 6 letters",
        });
      }
    const isExists = await User.findOne({ email });
    if (isExists)
      return res.render("doctor/createUser", {
        error: "User already exists",
        message: null,
      });
      const secPassword = await securePassword(req.body.password);
    const user = new User({
      name,
      email,
      mobile,
      password:secPassword,
      is_varified,
    });
    await user.save();
    return res.redirect("/doctor/dashboard");
  } catch (error) {
    console.log(error.message);
  }
},

 getAddPatient :async (req, res) => {
  try {
    const today = new Date();

    const medicines = await Medicine.find({
      expiry: { $gt: today }
    });
        res.render("doctor/addPatient", { error: null, message: null, medicines });
  } catch (error) {
    console.log(error.message);
  }
},

 getPatientsList: async (req, res) => {
  try {
    const patients = await Patient.aggregate([
      {
        $lookup: {
          from: "medicines",
          localField: "Medicines.medicine",
          foreignField: "_id",
          as: "Medicines.medicine",
        },
      },
    ]);

    res.render("doctor/patients", {
      patients,
      error: null,
      message: null,
    });
  } catch (error) {
    console.log(error.message);
  }
},

 searchPatient : async (req, res) => {
  const { q } = req.body;
  try {
    let patients;

    if (q) {
      patients = await Patient.aggregate([
        {
          $match: {
            name: { $regex: ".*" + q + ".*" }
          }
        },
        {
          $lookup: {
            from: "medicines",
            localField: "Medicines.medicine",
            foreignField: "_id",
            as: "Medicines.medicine"
          }
        }
      ]);
    } else {
      patients = await Patient.aggregate([
        {
          $lookup: {
            from: "medicines",
            localField: "Medicines.medicine",
            foreignField: "_id",
            as: "Medicines.medicine"
          }
        }
      ]);
    }

    res.render("doctor/patients", { patients, message: null, error: null });
  } catch (error) {
    console.log(error.message);
  }
},


 AddPatient : async (req, res) => {
  let { name, mobile, disease, DoctorName, selectedMedicines } = req.body;
  try {
    function generateRandomID(length) {
      const charset = "0123456789";
      let randomID = "";
      const charsetLength = charset.length;

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charsetLength);
        randomID += charset[randomIndex];
      }

      return randomID;
    }
    if(typeof selectedMedicines === "string"){
      let medicine = selectedMedicines
      selectedMedicines = []
      selectedMedicines.push(medicine)
    }
    const patient = new Patient({
      RegNo: generateRandomID(5),
      name,
      disease,
      mobile,
      DoctorName,
      Medicines: selectedMedicines?selectedMedicines.map((medId) => ({
        medicine: medId,
      })):null,
      addingDate: Date.now(),
    });
     console.log(patient)
    await patient.save();
    return res.redirect("/doctor/patients");
  } catch (error) {
    console.log(error.message);
  }
},

 editPatient :async (req, res) => {
  const { id } = req.params;
  try {
    const Pid = await Patient.findById(id);
    const patient = await Patient.aggregate([
      {
        $match: {
          _id: Pid._id,
        },
      },
      {
        $lookup: {
          from: "medicines",
          localField: "Medicines.medicine",
          foreignField: "_id",
          as: "Medicines.medicine", // Store the medicine details in an array
        },
      },
    ]);

    const currentMedicines = patient[0].Medicines;

    if (patient.length === 0) {
      return res.status(404).send("Patient not found");
    }

    const medicines = await Medicine.find();
    res.render("doctor/editPatient", {
      currentMedicines,
      patient,
      medicines,
      error: null,
      message: null,
    });
  } catch (error) {
    console.log(error.message);
    // Handle other errors here
    res.status(500).send("Internal Server Error");
  }
},

 updatePatient : async (req, res) => {
  let { id,name, disease, mobile, DoctorName, selectedMedicines } = req.body;
  try {
    if (!name)
      return res.render("doctor/createUser", { error: "Name is required" });
    if (name.length < 3) {
      return res.render("doctor/addPatient", {
        error: "name should contain atleast 3 letters",
      });
    }
    if (!disease)
      return res.render("doctor/createUser", {
        error: "Disease name is required",
      });
    if (!DoctorName)
      return res.render("doctor/createUser", {
        error: "doctors Name is required",
      });
      if(typeof selectedMedicines === "string"){
        let medicine = selectedMedicines
        selectedMedicines = []
        selectedMedicines.push(medicine)
      }
    await Patient.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          disease,
          mobile,
          DoctorName,
          Medicines: selectedMedicines?selectedMedicines.map((medId) => ({
            medicine: medId,
          })):null,
        },
      },
      { new: true }
    );
    res.redirect("/doctor/patients");
  } catch (error) {
    console.log(error.message);
  }
},

 deletePatient : async (req, res) => {
  const { id } = req.params;
  try {
    await Patient.findByIdAndDelete(id);
    res.redirect("/doctor/patients");
  } catch (error) {
    console.log(error.message);
  }
},

 medicineHistory :async (req,res)=>{
  try {
    const medicineDistributions = await MedicineDistribution.find() .populate('patient')
    res.render('doctor/medicineHistory',{medicineDistributions})
  } catch (error) {
    console.log(error.message)    
  }
}

};
