export const dbUserPermissions = Object.freeze({
  admin: 1, //person 4
  audit: 2, // audition 1
  registerPerson: 3, // person 4
  login: 4, // person 4
  jobs: 5, // audition 1
  jobPlacement: 6, //management 2
  classManipulation: 7, // management 2
  searchAuditHistory: 8, // audition 1
  bulkMoveAudit: 9, // audition 1
  placeOrders: 10, // orders 3
  auditOrderPermission: 11, // management 2
  orderHistory: 12, // orders 3
  fmvPriceChange: 13, // orders 3
  employeeStatistics: 14, // statistics 5
  announce: 15, // others 6
  driver2: 16, //others 6
  searchInventory: 17 //audition 1
})

export const dbSetOfPermission = Object.freeze({
  audition: 1,
  management: 2,
  orders: 3,
  privileges: 4,
  statistics: 5,
  others: 6
})

export const dbJobPermissions = Object.freeze({
  audit: 1,
})

export enum EOrderAuditPermission{
  ableToEdit = 1,
  askForEditing = 2,
  onlyAdminEdit = 3,
  lockedFromEditing = 4,
  notFound = 5
}

export const dbOrderEditPermissions = Object.freeze({
  ableToEdit: 1,
  askForEditing: 2,
  onlyAdminEdit: 3,
  lockedFromEditing: 4,
  notFound: 5
})