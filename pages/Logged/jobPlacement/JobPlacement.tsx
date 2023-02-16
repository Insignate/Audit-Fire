import { NextApiRequest, NextApiResponse } from "next";
import Head from "next/head";
import { ChangeEvent, FormEvent, useCallback, useContext, useEffect, useReducer } from "react";
import { LockSubmitButton } from "../../../components/buttons";
import { Checkbox } from "../../../components/Checkbox";
import Selectbox from "../../../components/Selectbox";
import { addCheckedToItems, useCheckbox } from "../../../components/useCheckbox";
import { IJobPlacement, IJobPlacementPermission } from "../../../database/postgres/Jobs/dbCom";
import { IJobPlacements } from "../../../database/postgres/Jobs/jobs";
import RequesterInfo from "../../../permissions/requester";
import { nextValidateLoginHeader } from "../../../schemas/dataValidation";
import { userTokenIdent } from "../../../schemas/user";
import { IJobPermissions, IJobPermissionsCheck } from "../../../tsTypes/psqlResponses";
import { getCookie } from "../../../utils/customCookies";
import { getFetch, jFetch } from "../../../utils/fetchs";
import { ModalsContext } from "../../../utils/Modals";

enum EActionType {
  fieldName,
  fieldNumber,
  send,
  sendComplete,
  addNewJobPlace,
  editFillJobPlace,
  removePlace
}

interface IActionType{
  type: EActionType
  field?: string
  value?: number
  name?: string
  jobPlace?: IJobPlacements["success"]
}

const reducer = (state: Init, action: IActionType) => {
  switch(action.type){
    case(EActionType.fieldName):
      return {...state, [action.field]: action.name}
    
    case(EActionType.fieldNumber):
    return {...state, [action.field]: action.value}

    case(EActionType.editFillJobPlace):
      return {...state, editPlacement: action.jobPlace}

    case(EActionType.send):
      return {...state, lockButton: true}

    case(EActionType.sendComplete):
      return {...state, lockButton: false}

    case(EActionType.removePlace):
      return {...state, editPlacement: state.editPlacement.filter(item => 
        item.v_id !== action.value
      )}
    
    case(EActionType.addNewJobPlace):
      return {...state, editPlacement: [{v_id: action.value, v_name: action.name}, ...state.editPlacement]}
    
    default: return {...state}
  }
}

class Init{
  placementName: string = ""
  lockButton: boolean = false
  editPlacement: IJobPlacements["success"] = []
  editPlaceSelected: number = 0
  
}

export default function JobPlacement(){

  const { obj, resetChecked, changeChecked, newInitialState } = useCheckbox()
  const [ state, dispach ] = useReducer(reducer, new Init)
  const { lockButton, placementName } = state
  
  const { obj: editObj, resetChecked: editResetChecked, changeChecked: editChangeChecked, newInitialState: editNewInitialState, checkTrue: editCheckTrue} = useCheckbox()
  const [ editState, editDispach ] = useReducer(reducer, new Init)
  const { lockButton: editLockButton, editPlacement, editPlaceSelected} = editState
  
  const [removeState, removeDispach] = useReducer(reducer, new Init)
  const {editPlaceSelected: removeSelected, lockButton: removeLockButton} = removeState
  
  const { showWindow } = useContext(ModalsContext)

  const addNewJobPlacement = useCallback( async (e: FormEvent<HTMLFormElement>) => {
    dispach({type: EActionType.send})
    e.preventDefault()
    const svrResp:IJobPlacement = await jFetch("jobs/set-new-job-placement", "POST", {placementName, checkbox: obj})
    if (svrResp.success)
      editDispach({type: EActionType.addNewJobPlace, name: placementName, value: svrResp.value})
    showWindow(svrResp)

    dispach({type: EActionType.sendComplete})

  } ,[placementName, obj, showWindow])

  const editJobPlacement = useCallback( async (e: FormEvent<HTMLFormElement>) => {
    editDispach({type: EActionType.send})
    e.preventDefault()
    const svrResp = await jFetch("jobs/edit-job-placement", "POST", {vid: editPlaceSelected, checkbox: editObj})
    showWindow(svrResp)
    editDispach({type: EActionType.sendComplete})
  }, [editPlaceSelected, editObj, showWindow])

  const editChangeSelected = useCallback( async (value: ChangeEvent<HTMLSelectElement>["target"]) => {
    const confValue = parseInt(value.value)
    editDispach({type: EActionType.fieldNumber, field: "editPlaceSelected", value: confValue})
    const svrResp: IJobPlacementPermission = await jFetch("jobs/get-job-placement-permissions", "POST", {v_id: confValue})
    if (svrResp.success)
      editCheckTrue(svrResp.success)
    else(editResetChecked())
  }, [editCheckTrue, editResetChecked])

  const removeChangeSelected = useCallback( async (value: ChangeEvent<HTMLSelectElement>["target"]) => {
    const confValue = parseInt(value.value)
    removeDispach({type: EActionType.fieldNumber, field: "editPlaceSelected", value: confValue})
  }, [])

  const removeSelectedItem = useCallback ( async (e: FormEvent<HTMLFormElement>) => {
    removeDispach({type: EActionType.send})
    e.preventDefault()

    const svrResp = await jFetch("jobs/remove-job-placement", "POST", {vid: removeSelected})
    if (svrResp.success)
    editDispach({type: EActionType.removePlace, value: removeSelected})
    showWindow(svrResp)
    removeDispach({type: EActionType.sendComplete})
  }, [removeSelected, showWindow])

  useEffect(() => {
    const getAllJobPermissions = async () => {
      const svrRespJobs: IJobPermissions = await getFetch('jobs/get-job-permissions');
      if(svrRespJobs.success){
        const addCheck: IJobPermissionsCheck["success"] = addCheckedToItems(svrRespJobs.success)
        newInitialState(addCheck)
        editNewInitialState(addCheck)
      } 
    } 

    const getAllPlacements = async () => {
      const svrResp: IJobPlacements = await getFetch('jobs/get-all-placements');
      if (svrResp.success)
      editDispach({type: EActionType.editFillJobPlace, jobPlace: svrResp.success})
    }

    getAllJobPermissions()
    getAllPlacements()
  }, [editNewInitialState, newInitialState])

  return (
    <div>
      <style jsx>{`
        form{
          display: inline-block;
          margin: 8px;
          vertical-align: top;
        }
        hr{
          margin: 8px 0;
        }
        input[type="text"]{
          width: fill-available;
        }

        
      `}
      </style>
      <Head>
        <title>Job Placement</title>
      </Head>
      <form className="window window-attention" onSubmit={e => addNewJobPlacement(e)}>
        <label >New Job Placement</label><br />
        <input 
          style={{marginTop: '4px'}}
          type='text' 
          placeholder="Enter Job Placement" 
          value={placementName} 
          onChange={e => dispach({type: EActionType.fieldName, field: "placementName", name: e.target.value})}
          required
        />
        <hr />
        <label>Job Permissions</label>
        <hr />
        {obj.map(({v_id, v_name, checked}) => 
          <Checkbox 
            key={v_id}
            checkHandler={changeChecked} 
            newName={v_name} 
            checked={checked} 
            id={v_id} />
        )}
        <hr />
        <LockSubmitButton text="Create" loadingText="Creating Placement" disabled={lockButton} />
        <button type="button" onClick={() => resetChecked()}>Reset</button>
      </form>

      <form className="window window-attention" onSubmit={e => editJobPlacement(e)}>
        <label >Edit Job Placement</label><br />
        <Selectbox 
          valueSelected={editPlaceSelected} 
          onChange={editChangeSelected} 
          selectInfoText={"---SELECT A JOB PLACE---"} 
          obj={editPlacement} 
          styling={`margin-top: 4px;`}
        />
        <hr />
        <label>Job Permissions</label>
        <hr />
        {editObj.map(({v_id, v_name, checked}) => 
          <Checkbox 
            key={v_id}
            checkHandler={editChangeChecked} 
            newName={v_name} 
            checked={checked} 
            id={v_id} />
        )}
        <hr />
        <LockSubmitButton text="Save Changes" loadingText="Saving Changes" disabled={editLockButton} />
        <button type="button" onClick={() => editResetChecked()}>Reset</button>
      </form>

      <form className="window window-attention" onSubmit={e => removeSelectedItem(e)}>
        <label>Delete Job Place</label><br />
        <Selectbox 
          valueSelected={removeSelected} 
          onChange={removeChangeSelected} 
          selectInfoText={"---SELECT A JOB PLACE---"} 
          obj={editPlacement} 
          styling={`margin-top: 4px;`}
        />
        <hr />
        <LockSubmitButton text="Remove" loadingText="Removing Job" disabled={removeLockButton} />
      </form>
    </div>
  )
}


export const getServerSideProps = async ({req, res} : {req: NextApiRequest, res: NextApiResponse}) => {

  const value = await nextValidateLoginHeader(userTokenIdent, req, res, async () => {
    const {token, ident} = getCookie(req)
    const reqPermission = new RequesterInfo();
    await reqPermission.setPermissions(ident, token)
    
    if(reqPermission.canLogin !== true ) return {redirect: {
      permanent: false,
      destination: '/'
    }}
    if(reqPermission.canJobPlacement === true) return {props: {
      check: true
    }};
    else return {notFound : true}
  })
  return value
}