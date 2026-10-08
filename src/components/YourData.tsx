import { BackupExport } from './BackupExport'
import { BackupImport } from './BackupImport'
import { ResetProgress } from './ResetProgress'

export function YourData() {
  return (
    <section className="card your-data" aria-labelledby="your-data-title">
      <h2 id="your-data-title">Your data</h2>
      <p>
        Your progress is saved in this browser only. Back it up before you clear browser data or switch devices.
      </p>
      <h3>Back up</h3>
      <BackupExport />
      <BackupImport />
      <h3>Start over</h3>
      <ResetProgress />
    </section>
  )
}
