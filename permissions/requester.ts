import { dbUserPermissions } from './dbRegisterPerm';
import { getPermissions, getAdminLevel, getMyUserId } from '../database/postgres/userData'
import { NextApiRequest } from 'next';
import { getCookie } from '../utils/customCookies';
class RequesterInfo{
  private adminLevel = 0
  private myId = null

  private initiated = false

  private errorMessage = {}

  private arrPermission: Array<number> = []

  get isAdmin(){ 
    if (this.arrPermission.includes(dbUserPermissions.admin) !== true) return this.errorMessage = {error: "You are not an Admin"}
    return true
  }
  get canRegisterPerson(){
    if (this.arrPermission.includes(dbUserPermissions.registerPerson) !== true) return this.errorMessage = {error: "You don't have permissions to register a person"}
    return true
  }
  get canLogin(){
    if (this.arrPermission.includes(dbUserPermissions.login) !== true) return this.errorMessage = {error: "You are not able to log in"}
    return true;
  }
  get canCreateJobs(){
    if (this.arrPermission.includes(dbUserPermissions.jobs) !== true) return this.errorMessage = {error: "You dont have permissions to create jobs"}
    return true
  }
  get canAudit(){ 
    if (this.arrPermission.includes(dbUserPermissions.audit) !== true) return this.errorMessage = {error: "You don't have permissions to audit"}
    return true
  }
  get canJobPlacement(){
    if (this.arrPermission.includes(dbUserPermissions.jobPlacement) !== true) return this.errorMessage = {error: "You dont have permssions to Place Jobs"}
    return true
  }
  get canManipulateClass(){
    if(this.arrPermission.includes(dbUserPermissions.classManipulation) !== true) return this.errorMessage = {error: "You do not have permission to Register/Manipulate Classes"}
    return true
  }
  get canSearchAuditHistory(){
    if (this.arrPermission.includes(dbUserPermissions.searchAuditHistory) !== true) return this.errorMessage = {error: "You do not have permissions to Search the audit history"}
    return true
  }
  get canBulkMoveAudit(){
    if (this.arrPermission.includes(dbUserPermissions.bulkMoveAudit) !== true) return this.errorMessage = {error: 'You cannot bulk move audits'}
    return true
  }
  get canPlaceOrders(){
    if (this.arrPermission.includes(dbUserPermissions.placeOrders) !== true) return this.errorMessage = {error: 'You cannot place orders'}
    return true
  }
  get canAuditOrderManage(){
    if (this.arrPermission.includes(dbUserPermissions.auditOrderPermission) !== true) return this.errorMessage = {error: 'You dont have audits and orders permissions'}
    return true
  }
  get canOrderHistory(){
    if (this.arrPermission.includes(dbUserPermissions.orderHistory) !== true) return this.errorMessage = {error: 'You do not have permissions to view the order history'}
    return true
  }
  get canFmvPriceChange(){
    if (this.arrPermission.includes(dbUserPermissions.fmvPriceChange) !== true) return this.errorMessage = {error: 'You do not have permissions to change the Fmv price'}
    return true
  }
  get canEmployeeStatistics(){
    if (this.arrPermission.includes(dbUserPermissions.employeeStatistics) !== true) return this.errorMessage = {error: 'You do not have permissions to get the employee statistics'}
    else return true
  }
  get canAnnounce(){
    if (this.arrPermission.includes(dbUserPermissions.announce) !== true) return this.errorMessage = {error: 'You do not have permissions to change announcements'}
    else return true
  }
  get canDriveR2(){
    if (this.arrPermission.includes(dbUserPermissions.driver2) !== true) return this.errorMessage = {error: 'You do not have permissions to get drive reports'}
    else return true
  }  
  get canSearchInventory(){
    if (this.arrPermission.includes(dbUserPermissions.searchInventory) !== true) return this.errorMessage = {error: 'You do not have permissions to search the inventory'}
    else return true
  }

  get myAdminLevel(){ return this.adminLevel;}
  get myUserId(){return this.myId;}


  isInitiated(){return this.initiated;}


  async initiate(ident: string, token: string){
    const permInit = await this.setPermissions(ident, token);
    const admInit = await this.setAdmLevel(ident, token);
    const idInit = await this.setId(ident, token);
    
    if (permInit && admInit && idInit) this.initiated = true;
  }

  async initiateReq(req: NextApiRequest){
    const {ident, token} = getCookie(req)
    await this.initiate(ident, token)
  }

  async setPermissionsReq(req: NextApiRequest){
    const {ident, token} = getCookie(req)
    await this.setPermissions(ident, token)
  }
  async setIdReq(req: NextApiRequest){
    const {ident, token} = getCookie(req)
    await this.setId(ident, token)
  }
  
  async setPermissions(ident: string, token: string){
    try {
      const svrResp = await getPermissions(ident,token)
      if (svrResp.success){
        this.arrPermission = svrResp.success.map(({perm}) => perm)
      }
      return true;
    } catch (err) {
      console.error(err.message);
    }
    return false;
  }
  async setAdmLevel(ident: string, token: string){
    try {
      const svrResp = await getAdminLevel(ident, token);
      if (svrResp.success){
        this.adminLevel = svrResp.success;
        return true; 
      }
      
    } catch (err) {
      console.error(err.message);
    }
    return false;
  }
  async setId(ident: string, token: string){
    try {
      const idResp = await getMyUserId(ident, token);
      if (idResp.success)
        this.myId = idResp.success
      return true;
    } catch (err) {
      console.error(err.message);
    }
    return false;
  }

}

export default RequesterInfo;