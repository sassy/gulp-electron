var Decompress, File, PLUGIN_NAME, PluginError, ProgressBar, Promise, async, chalk, childProcess, electron, fs, getApmPath, grs, isDir, isExists, isFile, mv, path, rm, spawn, through, util, wrench;

fs = require('fs');

grs = require('grs');

path = require('path');

async = require('async');

wrench = require('wrench');

mv = require('mv');

rm = require('rimraf');

util = require('gulp-util');

chalk = require('chalk');

Promise = require('promise-simple');

Decompress = require('decompress');

PluginError = util.PluginError;

through = require('through2');

childProcess = require('child_process');

ProgressBar = require('progress');

File = require('vinyl');

PLUGIN_NAME = 'gulp-electron';

module.exports = electron = function(options) {
  var bufferContents, endStream, packageJson;
  options = options || {};
  if (!options.release || !options.version || !options.src || !options.cache) {
    throw new PluginError('Miss version or release path.');
  }
  packageJson = options.packageJson;
  if (typeof options.packageJson === 'string') {
    packageJson = require(packageJson);
  }
  if (options.platforms == null) {
    options.platforms = ['darwin'];
  }
  if (options.apm == null) {
    options.apm = getApmPath();
  }
  if (options.symbols == null) {
    options.symbols = false;
  }
  if (options.rebuild == null) {
    options.rebuild = false;
  }
  if (options.ext == null) {
    options.ext = 'zip';
  }
  if (typeof options.platforms === 'string') {
    options.platforms = [options.platforms];
  }
  bufferContents = function(file, enc, callback) {
    return callback();
  };
  endStream = function(callback) {
    var platforms, push;
    push = this.push;
    platforms = ['darwin', 'win32', 'linux', 'darwin-x64', 'linux-ia32', 'linux-x64', 'win32-ia32', 'win32-x64'];
    return async.eachSeries(options.platforms, function(platform, cb) {
      var binName, cache, cacheFile, cachePath, cacheZip, cacheedPath, copyOption, defaultAppName, electronFile, electronFileDir, electronFilePath, identity, packagingCmd, pkg, pkgZip, pkgZipDir, pkgZipFilePath, pkgZipPath, platformDir, platformPath, signingCmd, src, suffix, targetApp, targetAppDir, targetAppPath, targetDir, targetDirPath, targetZip, unpackagingCmd, _ref, _ref1, _src;
      if (platform === 'osx') {
        platform = 'darwin';
      }
      if (platform === 'win') {
        platform = 'win32';
      }
      if (platforms.indexOf(platform) < 0) {
        throw new PluginError("Not support platform " + platform);
      }
      if (options.ext == null) {
        options.ext = "zip";
      }
      cacheZip = cache = "electron-" + options.version + "-" + platform;
      if (options.symbols) {
        cacheZip += '-symbols';
      }
      cacheZip += "." + options.ext;
      pkgZip = pkg = "" + packageJson.name + "-" + packageJson.version + "-" + platform;
      if (options.symbols) {
        pkgZip += '-symbols';
      }
      pkgZip += "." + options.ext;
      cachePath = path.resolve(options.cache, options.version);
      cacheFile = path.resolve(cachePath, cacheZip);
      cacheedPath = path.resolve(cachePath, cache);
      pkgZipDir = path.join(options.release, options.version);
      pkgZipPath = path.resolve(pkgZipDir);
      pkgZipFilePath = path.resolve(pkgZipDir, pkgZip);
      platformDir = path.join(pkgZipDir, platform);
      platformPath = path.resolve(platformDir);
      src = "";
      targetApp = "";
      defaultAppName = "Electron";
      suffix = "";
      _src = 'resources/app';
      if (platform.indexOf('darwin') >= 0) {
        suffix = ".app";
        electronFile = "Electron" + suffix;
        targetZip = packageJson.name + suffix;
        _src = binName + '/Contents/Resources/app/';
      } else if (platform.indexOf('win') >= 0) {
        suffix = ".exe";
        electronFile = "electron" + suffix;
        targetZip = ".";
      } else {
        electronFile = "electron";
        targetZip = ".";
      }
      binName = packageJson.name + suffix;
      electronFileDir = path.join(platformDir, electronFile);
      electronFilePath = path.resolve(electronFileDir);
      targetAppDir = path.join(platformDir, binName);
      targetAppPath = path.resolve(targetAppDir);
      targetDir = path.join(platformDir, _src);
      targetDirPath = path.resolve(targetDir);
      copyOption = {
        forceDelete: true,
        excludeHiddenUnix: false,
        inflateSymlinks: false
      };
      identity = "";
      if ((((_ref = options.platformResouces) != null ? (_ref1 = _ref.darwin) != null ? _ref1.identity : void 0 : void 0) != null) && isFile(options.platformResouces.darwin.identity)) {
        identity = fs.readFileSync(options.platformResouces.darwin.identity, 'utf8').trim();
      }
      signingCmd = {
        darwin: [
          {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Electron\\ Framework.framework')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Electron\\ Helper EH.app')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Electron\\ Helper NP.app')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Electron\\ Helper.app')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'ReactiveCocoa.framework')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Squirrel.framework')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, path.join(targetAppDir, 'Contents', 'Frameworks', 'Mantle.framework')]
          }, {
            cmd: 'codesign',
            args: ['--deep', '--force', '--verbose', '--sign', identity, targetAppDir]
          }
        ]
      };
      unpackagingCmd = {
        win32: {
          cmd: '7z',
          args: ['x', cacheFile, '-o' + cacheedPath]
        },
        darwin: {
          cmd: 'unzip',
          args: ['-o', cacheFile, '-d', cacheedPath]
        },
        linux: {
          cmd: 'unzip',
          args: ['-o', cacheFile, '-d', cacheedPath]
        }
      };
      packagingCmd = {
        win32: {
          cmd: '7z',
          args: ['a', path.join('..', pkgZip), targetZip],
          opts: {
            cwd: platformPath
          }
        },
        darwin: {
          cmd: 'ditto',
          args: ['-c', '-k', '--sequesterRsrc', '--keepParent', targetZip, path.join('..', pkgZip)],
          opts: {
            cwd: platformPath
          }
        },
        linux: {
          cmd: 'zip',
          args: ['-9', '-y', '-r', path.join('..', pkgZip), targetZip],
          opts: {
            cwd: platformPath
          }
        }
      };
      return async.series([
        function(next) {
          var bar;
          if (!isFile(cacheFile)) {
            util.log(PLUGIN_NAME, "download " + platform + " " + options.version + " cache filie.");
            wrench.mkdirSyncRecursive(cachePath);
            bar = null;
            return grs({
              repo: 'atom/electron',
              tag: options.version,
              name: cacheZip
            }).on('error', function(error) {
              throw new PluginError(error);
            }).on('size', function(size) {
              return bar = new ProgressBar("" + pkg + " [:bar] :percent :etas", {
                complete: '>',
                incomplete: ' ',
                width: 20,
                total: size
              });
            }).pipe(through(function(chunk, enc, cb) {
              bar.tick(chunk.length);
              this.push(chunk);
              return cb();
            })).pipe(fs.createWriteStream(cacheFile)).on('close', function() {
              return next();
            }).on('error', next);
          } else {
            return next();
          }
        }, function(next) {
          util.log(PLUGIN_NAME, "download " + platform + " " + options.version + " cache filie.");
          if (!isDir(cacheedPath)) {
            wrench.mkdirSyncRecursive(cacheedPath);
            util.log(PLUGIN_NAME, "unzip " + platform + " " + options.version + " electron.");
            return new Decompress({
              mode: '755'
            }).src(cacheFile).dest(cacheedPath).use(Decompress.zip({
              strip: 1
            })).run();
          } else {
            return next();
          }
        }, function(next) {
          wrench.mkdirSyncRecursive(platformPath);
          wrench.copyDirSyncRecursive(cacheedPath, platformPath, copyOption);
          return next();
        }, function(next) {
          util.log(PLUGIN_NAME, "distributing " + targetAppDir);
          return rm(targetAppPath, function() {
            return mv(electronFilePath, targetAppPath, next);
          });
        }, function(next) {
          if (!isExists(targetDirPath)) {
            return rm(targetDirPath, next);
          } else {
            return next();
          }
        }, function(next) {
          util.log(PLUGIN_NAME, "" + options.src + " -> " + targetDir + " distributing");
          wrench.mkdirSyncRecursive(targetDirPath);
          wrench.copyDirSyncRecursive(options.src, targetDirPath, copyOption);
          return next();
        }, function(next) {
          var promiseList;
          if (!options.packaging) {
            return next();
          }
          return next();
          if (platform === "darwin-x64" && process.platform === "darwin") {
            if (identity === "") {
              util.log(PLUGIN_NAME, "not found identity file. skip signing");
              return next();
            }
            util.log(PLUGIN_NAME, "signing " + platform);
            promiseList = [];
            signingCmd.darwin.forEach(function(cmd) {
              var p;
              p = Promise.defer();
              promiseList.push(p);
              return spawn(cmd, function() {
                return p.resolve();
              });
            });
            return Promise.when(promiseList).then(function() {
              util.log(PLUGIN_NAME, "signing done.");
              return next();
            });
          } else {
            return next();
          }
        }, function(next) {
          if (!options.packaging) {
            return next();
          }
          if (isFile(pkgZipFilePath)) {
            return rm(pkgZipFilePath, next);
          } else {
            return next();
          }
        }, function(next) {
          var cmd;
          if (!options.packaging) {
            return next();
          }
          util.log(PLUGIN_NAME, "packaging");
          cmd = packagingCmd[process.platform];
          return spawn(cmd, function() {
            util.log(PLUGIN_NAME, "packaging done");
            return next();
          });
        }
      ], function(error, results) {
        var _zip;
        _zip = path.join(pkgZipDir, pkgZip);
        util.log(PLUGIN_NAME, "" + _zip + " distribute done.");
        return cb();
      });
    }, function(error, results) {
      util.log(PLUGIN_NAME, "all distribute done.");
      return callback();
    });
  };
  return through.obj(bufferContents, endStream);
};

isDir = function() {
  var filepath;
  filepath = path.join.apply(path, arguments);
  return fs.existsSync(filepath) && !fs.statSync(filepath).isFile();
};

isFile = function() {
  var filepath;
  filepath = path.join.apply(path, arguments);
  return fs.existsSync(filepath) && fs.statSync(filepath).isFile();
};

isExists = function() {
  var filepath;
  filepath = path.join.apply(path, arguments);
  return fs.existsSync(filepath);
};

getApmPath = function() {
  var apmPath;
  apmPath = path.join('apm', 'node_modules', 'atom-package-manager', 'bin', 'apm');
  if (!isFile(apmPath)) {
    return apmPath = 'apm';
  }
};

spawn = function(options, callback) {
  var error, proc, stderr, stdout;
  stdout = [];
  stderr = [];
  error = null;
  util.log("> " + options.cmd + " " + (options.args.join(' ')));
  proc = childProcess.spawn(options.cmd, options.args, options.opts);
  proc.stdout.on('data', function(data) {
    stdout.push(data.toString());
    if (process.NODE_ENV === 'test') {
      return util.log(data.toString());
    }
  });
  proc.stderr.on('data', function(data) {
    return stderr.push(data.toString());
  });
  return proc.on('exit', function(code, signal) {
    var results;
    if (code !== 0) {
      error = new Error(signal);
    }
    results = {
      stderr: stderr.join(''),
      stdout: stdout.join(''),
      code: code
    };
    if (code !== 0) {
      throw new PluginError(PLUGIN_NAME, results.stderr || 'unknow error , maybe you can try delete the zip packages.');
    }
    return callback(error, results);
  });
};
