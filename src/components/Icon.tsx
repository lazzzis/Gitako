import * as React from 'react'
import Submodule from 'assets/icons/octicons/file-submodule.svg?svgr'
import Grabber from 'assets/icons/octicons/grabber.svg?svgr'
import Octoface from 'assets/icons/octicons/octoface.svg?svgr'
import ChevronDown from 'assets/icons/octicons/chevron-down.svg?svgr'
import TriangleRight from 'assets/icons/octicons/triangle-right.svg?svgr'
import FilePdf from 'assets/icons/octicons/file-pdf.svg?svgr'
import File from 'assets/icons/octicons/file.svg?svgr'
import FileZip from 'assets/icons/octicons/file-zip.svg?svgr'
import Markdown from 'assets/icons/octicons/markdown.svg?svgr'
import FileMedia from 'assets/icons/octicons/file-media.svg?svgr'
import FileCode from 'assets/icons/octicons/file-code.svg?svgr'
// import FileBinary from 'assets/icons/octicons/file-binary.svg?svgr'
// import FileSymlinkDirectory from 'assets/icons/octicons/file-symlink-directory.svg?svgr'
// import FileSymlinkFile from 'assets/icons/octicons/file-symlink-file.svg?svgr'
import X from 'assets/icons/octicons/x.svg?svgr'
import Gear from 'assets/icons/octicons/gear.svg?svgr'
import cx from 'utils/cx'

function getSVGIconComponent(type: string) {
  switch (type) {
    case 'submodule':
      return Submodule
    case 'grabber':
      return Grabber
    case 'octoface':
      return Octoface
    case 'chevron-down':
      return ChevronDown
    case 'x':
      return X
    case 'gear':
      return Gear
    case 'folder':
      return TriangleRight
    case '.pdf':
      return FilePdf
    case '.zip':
    case '.rar':
    case '.7z':
      return FileZip
    case '.md':
      return Markdown
    case '.png':
    case '.jpg':
    case '.gif':
    case '.bmp':
      return FileMedia
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
    case '.es6':
    case '.coffee':
    case '.css':
    case '.less':
    case '.scss':
    case '.sass':
      return FileCode
    // TODO: adapt to more file types
    // case '': return FileBinary
    // case '': return FileSubmodule
    // case '': return FileSymlinkDirectory
    // case '': return FileSymlinkFile
    default:
      return File
  }
}

const iconStyle = { width: '100%', height: '100%' }

type Props = {
  type: string
  className?: string
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
}

const Icon: React.SFC<Props> = function Icon({ type, className = undefined, ...otherProps }) {
  return (
    <div className={cx('octicon-wrapper', className)} {...otherProps}>
      {React.createElement(getSVGIconComponent(type), iconStyle)}
    </div>
  )
}

export default Icon