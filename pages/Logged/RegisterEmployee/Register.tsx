import { NextApiRequest, NextApiResponse } from 'next'
import React, { FormEvent, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { LockSubmitButton } from '../../../components/buttons'
import { addCheckedToItems, useCheckbox } from '../../../components/useCheckbox'
import RequesterInfo from '../../../permissions/requester'
import { nextValidateLoginHeader } from '../../../schemas/dataValidation'
import { userTokenIdent } from '../../../schemas/user'
import { getCookie } from '../../../utils/customCookies'
import { getFetch, jFetch } from '../../../utils/fetchs'
import { IPermissions, IPermissionsArray } from '../../../database/postgres/permissionList'
import { Checkbox } from '../../../components/Checkbox'
import { NumericInput } from '../../../components/NumericInput'
import { ModalsContext, EWindowType } from '../../../utils/Modals'
import { IBasicResponse, IUserInfo, IUserInfoPerm } from '../../../tsTypes/psqlResponses'
import { dbSetOfPermission } from '../../../permissions/dbRegisterPerm'
import Head from 'next/head'


interface IActionType {
  type: EActionType
  field?: string
  value?: string | number
  array?: IUser[]
  user?: IUser
  editUser?: IUserInfo["success"]
}

enum EActionType{
  field,
  submit,
  submitComplete,
  setUsers,
  addUser,
  setEditForm
}

const reducer = (state: Init, action: IActionType) => {
  switch (action.type){
    case EActionType.field:
      return {...state, [action.field]: action.value}

    case EActionType.submit:
      return {...state, disableSubmit: true}

    case EActionType.submitComplete:
      return {...state, disableSubmit: false}

    case EActionType.setUsers:
      return {...state, allUsers: action.array}

    case EActionType.addUser:
      return {...state, allUsers: [...state.allUsers, {v_name: action.user.v_name, v_id: action.user.v_id}]}
    
    case EActionType.setEditForm:
      const {userid, fname, lname, ulogin,
        admin_level} = action.editUser
      return {...state, 
        userId: userid, 
        firstName: fname, 
        lastName: lname,
        userName: ulogin,
        admLevel: admin_level
      }
    default: return{...state}
  }
}

class Init{
  userId: number = 0
  firstName: string = ''
  lastName: string = ''
  userName: string = ''
  password: string = ''
  rePassword: string = ''
  admLevel: number = 0
  disableSubmit: boolean = false
  allUsers: IUser[] = []
  selectedEditUser: 0
}

interface IUser{
  v_id: number
  v_name: string
}

interface INewUserResponse extends IBasicResponse{
  newUserId?: number
}

export const Register = () => {

  const {obj, resetChecked, changeChecked, newInitialState} = useCheckbox()
  const [state, dispatch] = useReducer(reducer, new Init)
  const {firstName, lastName, userName, password, rePassword, admLevel, disableSubmit} = state
  const msg = useContext(ModalsContext)
  
  const [editState, editDispatch] = useReducer(reducer, new Init)
  const {obj: editObj, resetChecked: editResetChecked, changeChecked: editChangeChecked, newInitialState: editNewInitialState, checkTrue: editConfigNewInitialState} = useCheckbox()
  const {userId, firstName: editFirstName, lastName: editLastName, userName: editUserName, password: editPassword, rePassword: editRePassword, admLevel: editAdmLevel, disableSubmit: editDisableSubmit, allUsers, selectedEditUser} = editState
  

  const submitForm = useCallback( async (e: FormEvent<HTMLFormElement>) => {
    dispatch({type: EActionType.submit})
    e.preventDefault()
    

    if (password !== rePassword) msg.showCustomWindow("Info", "Passwords do not match", EWindowType.info)
    else {
      const svrResp : INewUserResponse = await jFetch("employee-registry/register", "POST", {firstName, 
        lastName, 
        login: userName, 
        password, 
        repassword: rePassword,
        admLevel,
        checkbox: obj
      })
      if(svrResp.success)
      editDispatch({type: EActionType.addUser, user: {v_name: firstName + ' ' + lastName, v_id: svrResp.newUserId}})
      msg.showWindow(svrResp)
    }
    dispatch({type: EActionType.submitComplete})
  }, [lastName, userName, password, rePassword, admLevel, obj, firstName, msg])

  const changeLevel = useCallback((newValue:number) => {
    dispatch({type: EActionType.field, field: 'admLevel', value: newValue})
  }, [])

  const submitEditForm = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    editDispatch({type: EActionType.submit})
    e.preventDefault()
    if (editPassword !== editRePassword) msg.showCustomWindow("Info", "Passwords do not match", EWindowType.info)
    else{
      const svrResp = await jFetch("employee-registry/edit-user", "POST", {
        userId,
        firstName: editFirstName,
        lastName: editLastName,
        login: editUserName,
        password: editPassword,
        rePassword: editRePassword,
        checkbox: editObj
      })
      msg.showWindow(svrResp)
    }
    editDispatch({type: EActionType.submitComplete})
  }, [msg, userId, editFirstName, editLastName, editUserName, editPassword, editRePassword, editObj])

  const getUser = useCallback( async (e:React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(e.target.value)
    if (!isNaN(newValue) && newValue > 0){
      dispatch({type: EActionType.field, field: 'selectEditUser', value: newValue})

      const svrResp: IUserInfoPerm = await jFetch("employee-registry/get-user-info", "POST", {userId: newValue})

      if(svrResp.success){
        
        editDispatch({type: EActionType.setEditForm, editUser: svrResp.success.userInfo})
        
        editResetChecked()
        if (svrResp.success.userPerm.success)
        editConfigNewInitialState(svrResp.success.userPerm.success)
      }  //@ts-ignore
      else msg.showWindow(svrResp)
    }
    else {
      editDispatch({
        type: EActionType.setEditForm, 
        editUser: {userid: 0, fname: '', lname: '', ulogin: '',
        admin_level: 0}
      })
      editResetChecked()
    }    
  }, [editConfigNewInitialState, editResetChecked, msg])

  const editChangeLevel = useCallback((newValue:number) => {
    editDispatch({type: EActionType.field, field: 'admLevel', value: newValue})
  }, [])

  useEffect(() => {
    const getPermissions = async () => {
      const svrResp: IPermissions = await getFetch("get-all-permissions");
      if (svrResp.success){
        const items: IPermissionsArray = addCheckedToItems(svrResp.success)
        newInitialState(items)
        editNewInitialState(items)
      }
    }

    const getRegisteredUsers = async () => {
      const svrResp = await getFetch('employee-registry/get-users');
      if(svrResp.success){
        editDispatch({type: EActionType.setUsers, array: svrResp.success})
      }
      else (msg.showWindow(svrResp))
    }
    getPermissions()
    getRegisteredUsers()
  }, [])
  
  return (<>
    <style jsx>{`
      form{
        display: inline-block;
        margin: 8px;
      }
      tbody > tr > td:first-of-type{
        text-align: right;
      }
    `}</style>
    <Head>
      <title>Employee Registry</title>
    </Head>
    <form autoComplete="off" onSubmit={submitForm} className='window window-attention'>
      <label style={{display: "block", textAlign: "center", paddingBottom: "8px"}}>Register Employee</label>
      <hr />
      <table>
        <thead>
          <tr>
            <th><label></label></th>
            <th><label>Credentials</label></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><label>First Name:</label></td>
            <td><input 
              type="text" 
              name="firstname" 
              placeholder="Enter First Name" 
              minLength={1} 
              maxLength={30}
              value={firstName}
              onChange={e => dispatch({type: EActionType.field, field:"firstName" , value: e.target.value })}
              required
            /></td>
          </tr>
          <tr>
            <td><label>Last Name:</label></td>
            <td><input 
              type="text" 
              name="lastname" 
              placeholder="Enter Last Name" 
              minLength={1} 
              maxLength={30}
              value={lastName}
              onChange={e => dispatch({type: EActionType.field, field:"lastName" , value: e.target.value })}
              required 
            /></td>
          </tr>
          <tr>
            <td><label>Login:</label></td>
            <td><input 
              type="text" 
              name="login" 
              placeholder="Enter Login" 
              minLength={4} 
              maxLength={20} 
              value={userName}
              onChange={e => dispatch({type: EActionType.field, field:"userName" , value: e.target.value })}
              required
              autoComplete="none"
            /></td>
          </tr>
          <tr>
            <td><label>Password:</label></td>
            <td><input 
              id="password" 
              type="password" 
              name="password" 
              placeholder="Enter Password" 
              minLength={8} 
              value={password}
              onChange={e => dispatch({type: EActionType.field, field:"password" , value: e.target.value })}
              required
              autoComplete="new-password"
            /></td>
          </tr>
          <tr>
            <td><label>Re-Type Password:</label></td>
            <td><input 
              id="confirm_password" 
              type="password" 
              name="repassword" 
              placeholder="Re-Type Password" 
              minLength={8} 
              value={rePassword}
              onChange={e => dispatch({type: EActionType.field, field:"rePassword" , value: e.target.value })}
              required
              autoComplete="new-password"
            /></td>
          </tr>
        </tbody>
      </table>
      <hr className='hr hr-attention' style={{margin: "6px 0"}} />
      <label>User Permissions</label>
      <hr style={{margin: "6px 0 0 0"}} />
      <fieldset>
        <legend>Person Privileges</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.privileges).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
        <label>Admin Level: </label>
        {useMemo(() => <NumericInput
        name="admLevel"
        placeholder="level" 
        min={0} 
        max={999} 
        value={admLevel}
        pattern={"^\d{1,3}$"}
        handleChange={changeLevel}
      />, [admLevel, changeLevel])}
      </fieldset>
      <fieldset>
        <legend>Audition</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.audition).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
      </fieldset>
      <fieldset>
        <legend>Management</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.management).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
      </fieldset>
      <fieldset>
        <legend>Orders</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.orders).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
      </fieldset>
      <fieldset>
        <legend>Statistics</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.statistics).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
      </fieldset>
      <fieldset>
        <legend>Others</legend>
        {useMemo(() => obj.filter(item => item.v_group === dbSetOfPermission.others).map(item => <Checkbox 
          checkHandler={changeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[obj, changeChecked])}
      </fieldset>

      <hr style={{margin: "6px 0"}} />
      <button type="button" onClick={() => resetChecked()}>reset</button>
      <LockSubmitButton text="Register" loadingText="Creating New User" disabled={disableSubmit} />
    </form>
    <form autoComplete="off" onSubmit={submitEditForm} className='window window-attention'>
    
      <label>Edit Employee: </label>
      <select value={selectedEditUser} onChange={e => getUser(e)}>
        <option value='0'>---</option>
        {useMemo(() => 
          allUsers.map(({v_id, v_name}) => 
          <option value={v_id} key={v_id}>{v_name}</option>
        ), [allUsers])}
      </select>
      <hr />
      <table>
        <thead>
          <tr>
            <th><label></label></th>
            <th><label>Credentials</label></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><label>First Name:</label></td>
            <td>
            {useMemo(() => <input 
              type="text" 
              name="firstname" 
              placeholder="Enter First Name"
              minLength={1} 
              maxLength={30}
              value={editFirstName}
              onChange={e => editDispatch({type: EActionType.field, field:"firstName" , value: e.target.value })}
              required
            />,[editFirstName])}
            </td>
          </tr>
          <tr>
            <td><label>Last Name:</label></td>
            <td>{useMemo(() => <input 
              type="text" 
              name="lastname" 
              placeholder="Enter Last Name" 
              minLength={1} 
              maxLength={30}
              value={editLastName}
              onChange={e => editDispatch({type: EActionType.field, field:"lastName" , value: e.target.value })}
              required 
            />, [editLastName])}</td>
          </tr>
          <tr>
            <td><label>Login:</label></td>
            <td>{useMemo(() => <input 
              type="text" 
              name="login" 
              placeholder="Enter Login" 
              minLength={4} 
              maxLength={20} 
              value={editUserName}
              onChange={e => editDispatch({type: EActionType.field, field:"userName" , value: e.target.value })}
              autoComplete="new-password"
              required
            />, [editUserName])}</td>
          </tr>
          <tr>
            <td><label>Password:</label></td>
            <td>{useMemo(() => <input 
              id="password" 
              type="password" 
              name="password" 
              pattern="a^|.{8,}"
              placeholder="Leave blank to keep the same" 
              minLength={8} 
              value={editPassword}
              onChange={e => editDispatch({type: EActionType.field, field:"password" , value: e.target.value })}
              autoComplete="new-password"
            />, [editPassword])}</td>
          </tr>
          <tr>
            <td><label>Re-Type Password:</label></td>
            <td>{useMemo(() => <input 
              id="confirm_password" 
              type="password" 
              name="repassword" 
              placeholder="Leave blank to keep the same"
              pattern="a^|.{8,}"
              value={editRePassword}
              onChange={e => editDispatch({type: EActionType.field, field:"rePassword" , value: e.target.value })}
              
            />, [editRePassword])}</td>
          </tr>
        </tbody>
      </table>
      <hr style={{margin: "6px 0"}} />
      <label>User Permissions</label>
      <hr style={{margin: "6px 0 0 0"}} />
      <fieldset>
        <legend>Person Privileges</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.privileges).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
        <label>Admin Level: </label>
        {useMemo(() => <NumericInput
        name="admLevel"
        placeholder="level" 
        min={0} 
        max={999} 
        value={editAdmLevel}
        pattern={"^\d{1,3}$"}
        handleChange={editChangeLevel}
      />, [editAdmLevel, editChangeLevel])}
      </fieldset>
      <fieldset>
        <legend>Audition</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.audition).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
      </fieldset>
      <fieldset>
        <legend>Management</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.management).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
      </fieldset>
      <fieldset>
        <legend>Orders</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.orders).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
      </fieldset>
      <fieldset>
        <legend>Statistics</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.statistics).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
      </fieldset>
      <fieldset>
        <legend>Others</legend>
        {useMemo(() => editObj.filter(item => item.v_group === dbSetOfPermission.others).map(item => <Checkbox 
          checkHandler={editChangeChecked} 
          newName={item.v_permission} 
          checked={item.checked}
          key={item.v_id}
          id={item.v_id}
        />),[editObj, editChangeChecked])}
      </fieldset>
      <hr style={{margin: "6px 0"}} />
      <button type="button" onClick={() => editResetChecked()}>reset</button>
      <LockSubmitButton text="Save Changes" loadingText="Saving Changes" disabled={editDisableSubmit} />
    </form>
    </>
  )
}
export default Register

export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    if(reqPermission.canLogin === true && reqPermission.canRegisterPerson === true) return true;
    else return false
  })
  
  if (value !== true){ 
    return {notFound : true}
  }
  return {
    props: {
      check: true
    }
  }
}