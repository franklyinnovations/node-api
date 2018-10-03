'use strict';

const log = require('./controllers/log');

exports.all = promises => {
	let keys = Object.keys(promises),
		promiseArray = new Array(keys.length);
	for (let i = keys.length - 1; i >= 0; i--) {
		promiseArray[i] = promises[keys[i]];
	}
	return Promise.all(promiseArray).then(
		results => {
			let result = {};
			for (let i = keys.length - 1; i >= 0; i--) {
				result[keys[i]] = results[i];
			}
			return result;
		}
	);
};

exports.basicClasses = [
	{ classesdetails: 
		[{ 
			name: 'First', 
			languageId: 1
		}],
	display_order: '1',
	lang: 'en',
	langId: 1,
	is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Second', 
			languageId: 1
		}],
	display_order: '2',
	lang: 'en',
	langId: 1,
	is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Third', 
			languageId: 1
		}],	
	  display_order: '3',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Fourth', 
			languageId: 1
		}],	
	  display_order: '4',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Fifth', 
			languageId: 1
		}],	
	  display_order: '5',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Sixth', 
			languageId: 1
		}],	
	  display_order: '6',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Seventh', 
			languageId: 1
		}],	
	  display_order: '7',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Eighth', 
			languageId: 1
		}],	
	  display_order: '8',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Ninth', 
			languageId: 1
		}],	
	  display_order: '9',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Tenth', 
			languageId: 1
		}],	
	  display_order: '10',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Eleventh', 
			languageId: 1
		}],	
	  display_order: '11',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ classesdetails: 
		[{ 
			name: 'Twelveth', 
			languageId: 1
		}],	
	  display_order: '12',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	}
];

exports.basicSections = [
	{ sectiondetails: 
		[{ 
			name: 'A', 
			languageId: 1
		}],
	  display_order: '1',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ sectiondetails: 
		[{ 
			name: 'B', 
			languageId: 1
		}],
	  display_order: '2',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ sectiondetails: 
		[{ 
			name: 'C', 
			languageId: 1
		}],	
	  display_order: '3',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ sectiondetails: 
		[{ 
			name: 'D', 
			languageId: 1
		}],	
	  display_order: '4',
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	}
];

exports.basicSubjects = [
	{ subjectdetails: 
		[{ 
			name: 'English', 
			alias: 'Eng', 
			languageId: 1
		}],
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Hindi', 
			alias: 'Hin', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Mathematics', 
			alias: 'Maths', 
			languageId: 1
		}],
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Science', 
			alias: 'Sci', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'History', 
			alias: 'His', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Social Study', 
			alias: 'SS', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Genral Knowledge', 
			alias: 'GK', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Moral Science', 
			alias: 'MS', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Geography', 
			alias: 'Geo', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Physics', 
			alias: 'Phy', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Chemistry', 
			alias: 'Chem', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Botany', 
			alias: 'Bot', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Zoology', 
			alias: 'Zoo', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Economics', 
			alias: 'Eco', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Political Science', 
			alias: 'Pol Sc', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Sociology', 
			alias: 'Soc', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	},
	{ subjectdetails: 
		[{ 
			name: 'Accountancy', 
			alias: 'Accy', 
			languageId: 1
		}],	
	  lang: 'en',
	  langId: 1,
	  is_active: 1 
	}
];

function createLanguageItems(langId, item) {
	if (langId == 1) {
		return [{...item, languageId: langId}];
	} else {
		return [{...item, languageId: 1}, {...item, languageId: langId}];
	}
}

exports.basicActivity = (masterId, langId)=>{
	return [
		{
			masterId,
			activitydetails:createLanguageItems(langId, {name: 'Regularity and Punctuality'}),
		},
		{
			masterId,
			activitydetails:createLanguageItems(langId, {name: 'Clarity In Speech'}),
		},
		{
			masterId,
			activitydetails:createLanguageItems(langId, {name: 'Story Telling'}),
		},
		{
			masterId,
			activitydetails:createLanguageItems(langId, {name: 'Leadership Qualities'}),
		},
		{
			masterId,
			activitydetails:createLanguageItems(langId, {name: 'Adjustment With Classmates'}),
		}
	];
};

exports.basicLeaveType = (masterId, langId)=>{
	return [
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Casual Leave', masterId}),
		},
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Maternity Leave', masterId}),
		},
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Medical Leave', masterId}),
		},
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Privilege Leave', masterId}),
		},
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Quarantine Leave', masterId}),
		},
		{
			masterId,
			is_active: 1,
			total_leaves: 10,
			empleavetypedetails:createLanguageItems(langId, {name: 'Study Leave', masterId}),
		}
	];
};

exports.basicInfra = (masterId, langId) => {
	return [
		{
			masterId,
			infratypedetails: createLanguageItems(langId, {name: 'Class Rooms'}),
			infrastructures: [
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '01',
						remarks: 'Class Rooms 01',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '02',
						remarks: 'Class Rooms 02',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '03',
						remarks: 'Class Rooms 03',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '04',
						remarks: 'Class Rooms 04',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '05',
						remarks: 'Class Rooms 05',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '06',
						remarks: 'Class Rooms 06',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '07',
						remarks: 'Class Rooms 07',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '08',
						remarks: 'Class Rooms 08',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '09',
						remarks: 'Class Rooms 09',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '10',
						remarks: 'Class Rooms 10',
					})
				},
			]
		},
		{
			masterId,
			infratypedetails: createLanguageItems(langId, {name: 'Lab'}),
			infrastructures: [
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '01',
						remarks: 'Lab 01',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '02',
						remarks: 'Lab 02',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '03',
						remarks: 'Lab 03',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '04',
						remarks: 'Lab 04',
					})
				},
			]
		},
		{
			masterId,
			infratypedetails: createLanguageItems(langId, {name: 'Library'}),
			infrastructures: [
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '01',
						remarks: 'Library 01',
					})
				},
			]
		},
		{
			masterId,
			infratypedetails: createLanguageItems(langId, {name: 'Hostel'}),
			infrastructures: [
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '01',
						remarks: 'Hostel 01',
					})
				},
				{
					masterId,
					is_active: 1,
					infrastructuredetails: createLanguageItems(langId, {
						code: '02',
						remarks: 'Hostel 02',
					})
				},
			]
		}
	];
};

exports.amw = fn => async (req, res, next) => {
	try {
		await Promise.resolve(fn(req, res, next));
	} catch (err) {
		res.send(log(req, err));
	}
};

exports.date_formats = [
	'DD/MM/YYYY',
	'MM/DD/YYYY',
	'YYYY/MM/DD',
];

exports.basicTags = [
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Very Poor',
			'description': 'Very Poor',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Poor',
			'description': 'Poor',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Satisfactory',
			'description': 'Satisfactory',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Need Practice',
			'description': 'Need Practice',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Bad',
			'description': 'Bad',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Good',
			'description': 'Good',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Excellent work',
			'description': 'Excellent work',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Hope this continues',
			'description': 'Hope this continues',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Work is improving',
			'description': 'Work is improving',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Growth',
			'description': 'Growth',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Good attitude',
			'description': 'Good attitude',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Progressing',
			'description': 'Progressing',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Difficulty understanding',
			'description': 'Difficulty understanding',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Not work up to ability',
			'description': 'Not work up to ability',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Needs strengthening',
			'description': 'Needs strengthening',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Needs guidance',
			'description': 'Needs guidance',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Capable of much better work',
			'description': 'Capable of much better work',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Difficulty with learning',
			'description': 'Difficulty with learning',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Average',
			'description': 'Average',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Low',
			'description': 'Low',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Especially good',
			'description': 'Especially good',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Grade level',
			'description': 'Grade level',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Working well',
			'description': 'Working well',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Be Serious',
			'description': 'Be Serious',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Vast background knowledge',
			'description': 'Vast background knowledge',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Very fine',
			'description': 'Very fine',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Strong',
			'description': 'Strong',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Homework or assignment not completed',
			'description': 'Homework or assignment not completed',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Resposible',
			'description': 'Resposible',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Cooperative, well behaved',
			'description': 'Cooperative, well behaved',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 1,
		'tagdetails': [{
			'title': 'Exceptional',
			'description': 'Exceptional',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Loss or theft',
			'description': 'Loss or theft',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'No Conveyance',
			'description': 'No Conveyance',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Eye infection',
			'description': 'Eye infection',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Slipped in bathroom',
			'description': 'Slipped in bathroom',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Bike/Car breakdown',
			'description': 'Bike/Car breakdown',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Work At Home',
			'description': 'Work At Home',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Daycare child Problems',
			'description': 'Daycare child Problems',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Bad Weather',
			'description': 'Bad Weather',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Adverse House Situations',
			'description': 'Adverse House Situations',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'dentist appointment',
			'description': 'dentist appointment',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'not well today',
			'description': 'not well today',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Spouse transferred to a new city',
			'description': 'Spouse transferred to a new city',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Caring for a sick family member',
			'description': 'Caring for a sick family member',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Prior Principal approval',
			'description': 'Prior Principal approval',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Exam preparation',
			'description': 'Exam preparation',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Stomach Upset',
			'description': 'Stomach Upset',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Flu',
			'description': 'Flu',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Fever',
			'description': 'Fever',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Funeral services for a member of the immediate family',
			'description': 'Funeral services for a member of the immediate family\r\n',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Virtual relative’s death',
			'description': 'Virtual relative’s death',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Quarantine under the direction of a health officer.',
			'description': 'Quarantine under the direction of a health officer.',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Personal illness',
			'description': 'Personal illness',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 2,
		'tagdetails': [{
			'title': 'Bus/train left',
			'description': 'Bus/train left',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Cold/Cough/Headache',
			'description': 'Cold/Cough/Headache',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Exam preparation',
			'description': 'Exam preparation',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'not well today',
			'description': 'not well today',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'dentist appointment',
			'description': 'dentist appointment',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Adverse House Situations',
			'description': 'Adverse House Situations',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Bad Weather',
			'description': 'Bad Weather',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Slipped in bathroom',
			'description': 'Slipped in bathroom',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Eye infection',
			'description': 'Eye infection',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Prior Principal approval',
			'description': 'Prior Principal approval',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Stomach Upset',
			'description': 'Stomach Upset',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Fever',
			'description': 'Fever',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Observance of a religious holiday or ceremony',
			'description': 'Observance of a religious holiday or ceremony',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Student serving on jury duty',
			'description': 'Student serving on jury duty',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Funeral services for a member of the immediate family',
			'description': 'Funeral services for a member of the immediate family',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Quarantine under the direction of a health officer.',
			'description': 'Quarantine under the direction of a health officer.',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Personal illness',
			'description': 'Personal illness',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Grandparents came',
			'description': 'Grandparents came',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Bus/train left',
			'description': 'Bus/train left',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'food poisoning',
			'description': 'food poisoning',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Forgot ID/Books',
			'description': 'Forgot ID/Books',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Family Member',
			'description': 'Family Member ',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Accident',
			'description': 'Accident',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Traffic',
			'description': 'Traffic',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Bus Late',
			'description': 'Bus Late',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Apparel error',
			'description': 'Apparel error',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Woeful skies',
			'description': 'Woeful skies',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Short sighted refuge',
			'description': 'Short sighted refuge',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 0,
		'tagdetails': [{
			'title': 'Alarm issue',
			'description': 'Alarm issue',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Image Clarity Needed',
			'description': 'Image Clarity Needed',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Writing needs improvement',
			'description': 'Writing needs improvement',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Poor',
			'description': 'Poor',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'very poor',
			'description': 'very poor',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Learn',
			'description': 'Learn',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Reading Practice Needed',
			'description': 'Reading Practice Needed',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Need practice',
			'description': 'Need practice',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Good',
			'description': 'Good',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Wrong Formula',
			'description': 'Wrong Formula',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Focus on Functionality',
			'description': 'Focus on Functionality',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Excellent work',
			'description': 'Excellent work',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Improvement Needed',
			'description': 'Improvement Needed',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Nice Work',
			'description': 'Nice Work',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Focus on Language',
			'description': 'Focus on Language',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 3,
		'tagdetails': [{
			'title': 'Very Good',
			'description': 'Very Good',
			'languageId': 1
		}]
	},
	{
		'is_active': 1,
		'type': 5,
		'tagdetails': [{
			'title': 'Good',
			'description': 'good',
			'languageId': 1
		}]
	}
];

exports.teacherDefaultRole = ['1','99','102','103','104','105','106','114','117','131','132','133','136','137','138','139','146','147','148','150','151','152','153','154','161','162','163','164','165','179','180','181','182','187','188','189','198','199','214','215','216','217','218','219','220','221','222','224','232','233','234','237','238','276','299','300','301','302','303'];

exports.studentDefaultRole = ['1','79','99','105','114','133','150','151','152','153','154','164','182','189','222','232','295','296','297','298','302'];

exports.parentDefaultRole = ['1','79','99','105','114','133','150','151','152','153','154','164','182','189','222','232','295','296','297','298','302'];

exports.transportDefaultRole = ['1','118','119','120','121','127','128','129','130','150','151','152','153','154','168','170','171','172','173','174','248','249','250','251','252','253','254','255','256','257','259','260','261'];