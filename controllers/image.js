const path = require('path'),
fs = require('fs'),
crypto = require('crypto'),
tmpdir = require('os').tmpdir(),
sharp = require('sharp');

const nothing = (() => 0);

function optimize (file, resize) {
	var ext = path.extname(file).toLowerCase();
	if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png')
		return;
	var tmpFile = path.join(
		tmpdir,
		'pateast_temp_files' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex') + ext
	);
	new Promise((resolve, reject) => {
		fs.access(file, fs.constants.R_OK, err => {
			if (err) {
				reject(err);
			} else {
				resolve(sharp(file))
			}
		})
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
	.then(saveinfo => new Promise((resolve, reject) => {
		fs.rename(tmpFile, file, err => {
			if (err) {
				reject(err);
			} else {
				resolve(true);
			}
		});
	})).catch(console.log);
};

function resizeImage(image) {
	return image.metadata().then(meta => {
		if (meta.width > 150 || meta.height > 150) {
			return image.resize(150, 150).max();
		}
		return image;
	});
}

module.exports.makeOptimizerHook = function (fieldname, resize) {
	return (instance => {
		var value = instance[fieldname];
		if (value === instance.previous(fieldname)) {
			return;
		}
		if (instance.previous(fieldname))
			fs.unlink(instance.previous(fieldname), () => 0);
		if (value && value.startsWith(tmpDir)) {
			return new Promise((resolve, reject) => {
				var newValue = path.join('public/uploads', value.substring(tmpDir.length));
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
	if (oldpath) fs.unlink(oldpath, () => 0);
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
		return Promise.resolve(path1)
	}
}

function createDir(dirpath) {
	if (!dirpath || dirpath === '.' || dirpath === '/') return Promise.resolve(true);
	return new Promise((resolve, reject) => {
		fs.access(dirpath, fs.constants.R_OK, err => {
			if (err) {
				createDir(path.dirname(dirpath))
				.then(() => fs.mkdir(dirpath, err => {
					if (err) {
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