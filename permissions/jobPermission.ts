import { getDB } from "../database/postgres/connection";
import { dbJobPermissions } from "./dbRegisterPerm";
const { db } = getDB()
class JobPermissions{

  private audit = false;

  private infoMessage = {}

  get canAudit(){
    return this.audit !== true ? 
    this.infoMessage = {info: 'Audit Closed, this job cannot be audited'} : 
    this.audit;
  }
  async getAuditPermission(id: number){
    const auditPermission = await db.func('job_get_audit_permission', [id]);
    this.setPermissions(auditPermission);
  }

  async getDbPermissions(jobId: number){
    const getJobPermissions = await db.func('job_get_permissions', [jobId])
    this.setPermissions(getJobPermissions);
  }

  getInfoMessage(){
    return this.infoMessage
  }
  
  setPermissions = permissions => {
    permissions.forEach(({perm}) => {
      if (perm === dbJobPermissions.audit) this.audit = true;
    });
  }

} 

export default JobPermissions