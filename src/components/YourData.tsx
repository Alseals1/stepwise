import { BackupExport } from './BackupExport'
import { BackupImport } from './BackupImport'
import { ResetProgress } from './ResetProgress'

/** The tools inside the Your data modal. The modal supplies the title. */
export function YourData() {
  return (
    <div className="your-data">
      <p>
        Your progress is saved in this browser only. Back it up before you clear browser data or switch devices.
      </p>
      <h3>Back up</h3>
      <BackupExport />
      <BackupImport />
      <h3>Start over</h3>
      <ResetProgress />
    </div>
  )
}
