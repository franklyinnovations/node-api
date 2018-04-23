define({ "api": [
  {
    "type": "post",
    "url": "/city/list",
    "title": "list all cities by state id",
    "name": "listCity",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "stateId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/country/list",
    "title": "list all countries",
    "name": "listCountry",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/state/list",
    "title": "list all states by country id",
    "name": "listState",
    "group": "Common_Api",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "countryId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Common_Api"
  },
  {
    "type": "post",
    "url": "/doctor/getById",
    "title": "Get doctor profile",
    "name": "getById",
    "group": "Doctor",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is doctor id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/doctor.js",
    "groupTitle": "Doctor"
  },
  {
    "type": "post",
    "url": "/medical_records/create",
    "title": "Create medical records",
    "name": "create",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "Date",
            "optional": false,
            "field": "date",
            "description": "<p>required yyyy-mm-dd</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "medical_record_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "img",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/delete",
    "title": "Delete records",
    "name": "delete",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical_record_id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/deleteItem",
    "title": "Delete records items",
    "name": "deleteItem",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical record item</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records/getById",
    "title": "Get medical record by Id",
    "name": "getById",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is medical record id</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/medical_records",
    "title": "Get medical records",
    "name": "medical_records",
    "group": "Medical",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/medical_records.js",
    "groupTitle": "Medical"
  },
  {
    "type": "post",
    "url": "/users/register/add",
    "title": "Patient signup",
    "name": "add",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "roleId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_type",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "device_id",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "device_type",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/addtag",
    "title": "add patient tags",
    "name": "addtag",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "patientId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagtypeId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "tagId",
            "description": "<p>required tagId should be in comma's sepetate like (23,45,78)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/filter_records",
    "title": "data searching",
    "name": "filter_records",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lang",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/patient-profile-data",
    "title": "Get patient data",
    "name": "patient_profile_data",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/patient/save",
    "title": "patinet save",
    "name": "save",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "userId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "countryId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "stateId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "cityId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "address",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "gender",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "zipcode",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "marital_status",
            "description": "<p>optional</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "blood_group",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "height_feet",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "height_inch",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "weight",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emergency_contact",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "dob",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "current_medication",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "past_medication",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/patient.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/update-profile",
    "title": "Update profile picture",
    "name": "update_profile",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here 'id' is userId</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_image",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/users/userupdate",
    "title": "User update",
    "name": "userupdate",
    "group": "Patient",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here 'id' is userId</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mobile",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>required</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/users.js",
    "groupTitle": "Patient"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagsbyType",
    "title": "Get tags by tagTypeId",
    "name": "tagsbyType",
    "group": "Tag",
    "description": "<p>{tagTypeId: 21, label: &quot;Medical record type&quot;} {tagTypeId: 20, label: &quot;Cigarette you smoke perday&quot;} {tagTypeId: 19, label: &quot;Alchoal Consumption&quot;} {tagTypeId: 18, label: &quot;Lifestyle&quot;} {tagTypeId: 17, label: &quot;Food Preference&quot;} {tagTypeId: 16, label: &quot;Occupation&quot;} {tagTypeId: 15, label: &quot;Surgeries&quot;} {tagTypeId: 14, label: &quot;Injuries&quot;} {tagTypeId: 13, label: &quot;Allergies&quot;} {tagTypeId: 12, label: &quot;Memberships&quot;} {tagTypeId: 11, label: &quot;Insurance Companies&quot;} {tagTypeId: 10, label: &quot;Problem Type&quot;} {tagTypeId: 9, label: &quot;SYMPTOMS for Doctors Clinic search&quot;} {tagTypeId: 8, label: &quot;Article Health Intrest Topics&quot;} {tagTypeId: 7, label: &quot;Chronic Disease&quot;} {tagTypeId: 6, label: &quot;Membership Councils&quot;} {tagTypeId: 5, label: &quot;Registration Council&quot;} {tagTypeId: 4, label: &quot;Education Colleage/University&quot;} {tagTypeId: 3, label: &quot;Education Qualification&quot;} {tagTypeId: 2, label: &quot;Specializations&quot;} {tagTypeId: 1, label: &quot;Services&quot;}</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "id",
            "description": "<p>required here id is tagTeypeId (above json shows all tagTypeId and their label)</p>"
          },
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/tag.js",
    "groupTitle": "Tag"
  },
  {
    "type": "post",
    "url": "/admin/tag/tagtypes",
    "title": "Get tagType list",
    "name": "tagtypes",
    "group": "Tag",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "integer",
            "optional": false,
            "field": "langId",
            "description": "<p>required</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/admin/tag.js",
    "groupTitle": "Tag"
  }
] });
