/* eslint-disable camelcase */

import {
  closeSync, existsSync, fstatSync, fsyncSync, openSync, readdirSync,
  readSync, renameSync, statSync, unlinkSync, writeSync
} from 'fs'
// import { seekSync } from 'fs-ext'
import { EOL } from 'os'
import readlines from '@prantlf/gen-readlines'
import { basename, dirname, extname, resolve, sep } from 'path'
import { checkType, checkType2, checkTypeOptional } from './checks'

export const appendmode = 'a'
export const dostermination = '\r\n'

export const e_alreadyopen = new Error('file already opened')
// export const e_cannotcopydirs = new Error()
// export const e_destalreadyexists = new Error()
// export const e_failedcreatingdest = new Error()
// export const e_failedopeningdest = new Error()
// export const e_failedopeningsource = new Error()
export const e_eof = new Error('end of file reached')
export const e_filename = new Error('invalid file name')
export const e_filesystemerror = new Error('file system operation failed')
export const e_insufficientmemory = new Error('not enough memory')
export const e_mode = new Error('illegal open option')
export const e_modeerror = new Error('incompatible open file mode')
export const e_notadirectory = new Error('not a directory')
export const e_notenoughfreespace = new Error('not enough free space')
export const e_notopen = new Error('file not open')
export const e_notopenforbinaryaccess = new Error('file not in binary mode')
export const e_notopenforread = new Error('file.readmode or file.readbinmode not passed as the mode parameter to file.open()')
export const e_notopenforwrite = new Error('file.writemode or file.writebinmode not passed as the mode parameter to file.open()')
export const e_notsamedirectory = new Error('the specified directory is different than the original file directory')
export const e_open = new Error('file could not be opened')
export const e_sourcenotfound = new Error('file cannot be located')
export const e_targetdirnotfound = new Error('target directory cannot be located or does not exist')
export const e_write = new Error('write error')

export const readmode = 'r'
export const readbinmode = 'r'
export const statfilemode = 'mode'
export const statinodenumber = 'ino'
export const statdeviceid = 'dev'
export const statrdevice = 'rdev'
export const statnumberlinks = 'nlink'
export const statuserid = 'uid'
export const statgroupid = 'gid'
export const statsize = 'size'
export const statlastaccesstime = 'atime'
export const statlastmodifytime = 'mtime'
export const statlastchangetime = 'ctime'
export const unixtermination = '\n'
export const writemode = 'w'
export const writebinmode = 'w'

function checkFile (file) {
  if (!file.fd) throw new TypeError('invalid file')
  return file
}

export function access (name) {
  checkType(name, 'string', 1)
  try {
    return existsSync(name) ? resolve(name) : undefined
  } catch (error) {
    return error
  }
}

export function close (file) {
  checkType(file, 'object', 1)
  const { fd } = checkFile(file)
  try {
    closeSync(fd)
    return true
  } catch (error) {
    return error
  }
}

export function create (name) {
  return open(name, writemode)
}

export { remove as delete }

function remove (name) {
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') name = checkFile(name).name
  try {
    unlinkSync(name)
    return true
  } catch (error) {
    return error
  }
}

export function dir (name) {
  checkTypeOptional(name, 'string', 1)
  try {
    const cwd = process.cwd()
    if (name) process.chdir(name)
    return cwd
  } catch (error) {
    return error
  }
}

// export function eof (file) {
//   checkType(file, 'object', 1)
//   const { fd } = checkFile(file)
//   try {
//     let stats = file.stats
//     if (!stats) stats = file.stats = fstatSync(fd)
//     return stats.size === seekSync(fd, 0, 1)
//   } catch (error) {
//     return error
//   }
// }

export function exists (name) {
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') name = checkFile(name).name
  try {
    return existsSync(name)
  } catch (error) {
    return error
  }
}

export function filelist (name) {
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') name = checkFile(name).name
  try {
    return readdirSync(name)
  } catch (error) {
    return error
  }
}

export function filetostring (file) {
  checkType(file, 'object', 1)
  const { fd, name, eol } = checkFile(file)
  return JSON.stringify({ fd, name, eol })
}

export function flush (file) {
  checkType(file, 'object', 1)
  const { fd } = checkFile(file)
  try {
    fsyncSync(fd)
  } catch (error) {
    return error
  }
}

export function getname (name) {
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') name = checkFile(name).name
  return basename(name)
}

export function getpath (name) {
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') name = checkFile(name).name
  return dirname(name)
}

export function isdir (name) {
  checkType(name, 'string', 1)
  try {
    const stats = statSync(name)
    return stats.isDirectory()
  } catch (error) {
    return error
  }
}

export function isdirspec (name) {
  checkType(name, 'string', 1)
  return name[name.length - 1] === sep
}

export function linetermination (file, eol) {
  checkType(file, 'object', 1)
  checkFile(file).eol = eol
  return eol
}

export function open (name, mode) {
  checkType(name, 'string', 1)
  if (mode !== appendmode && mode !== readmode && mode !== writemode) {
    throw new TypeError(`AppendMode, ReadMode , ReadBinMode, WriteMode or WriteBinMode expected, but ${typeof mode}" found in the second argument`)
  }
  try {
    const fd = openSync(name, mode)
    return { fd, name, eol: EOL }
  } catch (error) {
    return error
  }
}

export const openstream = open

export function read (file, count = 1024) {
  checkType(file, 'object', 1)
  let { fd, lines } = checkFile(file)
  checkType(count, 'number', 2)
  try {
    if (!lines) {
      let stats = file.stats
      if (!stats) stats = file.stats = fstatSync(fd)
      lines = file.lines = readlines(fd, stats.size, undefined, undefined, count)
    }
    const { value, done } = lines.next(count)
    if (done) return e_eof
    return value.toString()
  } catch (error) {
    return error
  }
}

export function readbytes (file, count) {
  checkType(file, 'object', 1)
  const { fd } = checkFile(file)
  checkType(count, 'number', 2)
  try {
    const buffer = Buffer.alloc(count)
    readSync(fd, buffer)
    return { buffer }
  } catch (error) {
    return error
  }
}

export function rename (oldName, newName) {
  checkType2(oldName, 'string', 'object', 1)
  if (typeof oldName === 'object') oldName = checkFile(oldName).name
  checkType2(newName, 'string', 'object', 2)
  if (typeof newName === 'object') newName = checkFile(newName).name
  try {
    renameSync(oldName, newName)
    return true
  } catch (error) {
    return error
  }
}

// export function rewind (file) {
//   seek(file, 0)
//   return true
// }

// export function seek (file, position) {
//   checkType(file, 'object', 1)
//   const { fd } = checkFile(file)
//   checkType(position, 'number', 2)
//   try {
//     return seekSync(fd, position, 0)
//   } catch (error) {
//     return error
//   }
// }

export function separator () {
  return sep
}

export function setname (file, newName) {
  checkType(file, 'object', 1)
  const { name } = checkFile(file)
  checkType(newName, 'string', 2)
  try {
    newName += extname(name)
    renameSync(name, newName)
    file.name = newName
    return file
  } catch (error) {
    return error
  }
}

export function stat (name) {
  let stats
  checkType2(name, 'string', 'object', 1)
  if (typeof name === 'object') {
    const file = checkFile(name)
    try {
      stats = file.stats
      if (!stats) stats = file.stats = fstatSync(file.fd)
    } catch (error) {
      return error
    }
  } else {
    try {
      stats = statSync(name)
    } catch (error) {
      return error
    }
  }
  const { ino, dev, rdev, nlink, uid, gid, size, atime, mtime, ctime } = stats
  return { ino, dev, rdev, nlink, uid, gid, size, atime, mtime, ctime }
}

export function stringfile (string) {
  checkType(string, 'string', 1)
  try {
    return JSON.parse(string)
  } catch (error) {
    return error
  }
}

export function write (file, text) {
  checkType(file, 'object', 1)
  const { fd, eol } = checkFile(file)
  checkType(text, 'string', 2)
  try {
    writeSync(fd, `${text}${eol}`)
    return true
  } catch (error) {
    return error
  }
}

export function writebytes (file, bytes) {
  checkType(file, 'object', 1)
  const { fd } = checkFile(file)
  checkType(bytes, 'object', 2)
  const { buffer } = bytes
  if (!buffer) return 0
  try {
    return writeSync(fd, buffer)
  } catch (error) {
    return error
  }
}
