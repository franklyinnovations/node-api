const
	fs = require('fs'),
	util = require('util'),
	path = require('path'),
	crypto = require('crypto'),
	tmpdir = require('os').tmpdir(),
	child_process = require('child_process'),
	sharp = require('sharp');

const
	iconImages = [
		'public/uploads/icon/id.png',
		'public/uploads/icon/male.png',
		'public/uploads/icon/user.png',
		'public/uploads/icon/user.jpeg',
		'public/uploads/icon/female.png',
		'public/uploads/icon/institute.png',
		'public/uploads/icon/vehicle-logo.png',
		'public/uploads/icon/no-image-available.png',
	];

const rename = util.promisify(fs.rename);
const exec = util.promisify(child_process.exec);

async function optimize (file, resize) {
	let ext = path.extname(file).toLowerCase().substring(1);
	if (/(?:jpg|png|jpeg)$/.test(ext)) {
		optimizeImage(file, resize);
	}
}

function optimizeImage(file, resize) {
	let ext = path.extname(file).toLowerCase();
	let tmpFile = path.join(
		tmpdir,
		'pateast_temp_files' +
			Date.now().toString(16) + 
			crypto.randomBytes(4).toString('hex') + ext,
	);
	new Promise((resolve, reject) => {
		fs.access(file, fs.constants.R_OK, err => {
			if (err) {
				reject(err);
			} else {
				resolve(sharp(file));
			}
		});
	})
		.then(image => resize ? resizeImage(image) : image)
		.then(image => {
			if (ext === '.jpg' || ext === '.jpeg') {
				return image.jpeg();
			} else {
				return image.png({compressionLevel: 9});
			}
		})
		.then(image => image.toFile(tmpFile))
		.then(() => new Promise((resolve, reject) => {
			fs.rename(tmpFile, file, err => {
				if (err) {
					reject(err);
				} else {
					resolve(true);
				}
			});
		})).catch(console.log);
}

async function convertVideo(file, newFile) {
	await exec(
		'ffmpeg -i ' + 
		JSON.stringify(file) + 
		' -f mp4 -vcodec libx264 -acodec aac -strict -2 ' +
		JSON.stringify(newFile), {
			cwd: process.cwd(),
		}
	);
	return newFile;
}

async function moveFile(file) {
	let newFile = path.join('public/uploads', file.substring(tmpDir.length));
	await createDir(path.dirname(newFile));
	let ext = path.extname(file).toLowerCase().substring(1);
	if (/(?:3gp|mp4|avi|wmv|mov|m4v|ogx)$/.test(ext)) {
		newFile = newFile.substring(0, newFile.lastIndexOf(ext)) + 'mp4';
		await convertVideo(file, newFile);
	} else {
		await rename(file, newFile);
	}
	return newFile;
}

function resizeImage(image) {
	return image.metadata().then(meta => {
		if (meta.width > 150 || meta.height > 150) {
			return image.resize(150, 150).max();
		}
		return image;
	});
}

module.exports.makeOptimizerHook = function (fieldname, resize) {
	return async instance => {
		let value = instance[fieldname], lastValue = instance.previous(fieldname);
		if (value === lastValue) return;
		if (lastValue && iconImages.indexOf(lastValue) === -1)
			fs.unlink(lastValue, () => 0);
		if (value && value.startsWith(tmpDir)) {
			instance[fieldname] = await moveFile(value);
			optimize(instance[fieldname], resize);
		} else if (value) {
			optimize(value, resize);
		}
	};
};

module.exports.makeOptimizerHookForQuestionOptionImage = function (fieldname, resize) {
	return (instance => {
		var value = instance[fieldname];
		if (value === instance.previous(fieldname)) {
			return;
		}
		if (instance.previous(fieldname) && iconImages.indexOf(instance.previous(fieldname)) === -1)
			fs.unlink(instance.previous(fieldname), () => 0);
		if (value && value.startsWith(tmpDir)) {
			return new Promise((resolve, reject) => {
				
				var getSplitedStr = value.substring(tmpDir.length);
				var explodeAbvStr = getSplitedStr.split('/');
				explodeAbvStr[0] = "option_image";
				var genNewStr = explodeAbvStr.join('/');

				var newValue = path.join('public/uploads', genNewStr);
				createDir(path.dirname(newValue))
					.then(() => {
						fs.rename(value, newValue, err => {
							if (err)
								reject(err);
							else
								resolve();
							optimize(newValue, resize);
						});
						instance[fieldname] = newValue;
					});
			});
		} else if (value) optimize(value, resize);
	});
};

module.exports.optimizeImageByPath = function (path1, oldpath, resize) {
	if ((path1 === oldpath) || (!path1)) return Promise.resolve(oldpath);
	if (oldpath && iconImages.indexOf(oldpath) === -1) fs.unlink(oldpath, () => 0);
	if (path1.startsWith(tmpDir)) {
		return new Promise((resolve, reject) => {
			var newpath = path.join('public/uploads', path1.substring(tmpDir.length));
			createDir(path.dirname(newpath))
				.then(() => {
					fs.rename(path1, newpath, err => {
						if (err)
							reject(err);
						else
							resolve(newpath);
						optimize(newpath, resize);
					});
				});
		});
	} else {
		optimize(path1, resize);
		return Promise.resolve(path1);
	}
};

function createDir(dirpath) {
	if (!dirpath || dirpath === '.' || dirpath === '/') return Promise.resolve(true);
	return new Promise((resolve, reject) => {
		fs.access(dirpath, fs.constants.R_OK, err => {
			if (err) {
				createDir(path.dirname(dirpath))
					.then(() => fs.mkdir(dirpath, err => {
						if (err && err.code !== 'EEXIST') {
							reject(err);
						} else {
							resolve(true);
						}
					})).catch(reject);
			} else {
				resolve(true);
			}
		});
	});
}