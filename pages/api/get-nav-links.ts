import { NextApiRequest, NextApiResponse } from 'next';
import { userTokenIdent } from '../../schemas/user';
import { validateLoginHeader } from '../../schemas/dataValidation';
import requestInfo from '../../permissions/requester'
import { getCookie } from '../../utils/customCookies';
import { array } from 'yup';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  
  if(req.method === "GET")
    try{
      const reqInfo = new requestInfo()
      const {token, ident} = getCookie(req)
      const arrayOfLinks = []
      let linksKey = 0
      await reqInfo.setPermissions(ident, token)

      if(
        reqInfo.canAudit === true || 
        reqInfo.canCreateJobs === true || 
        reqInfo.canBulkMoveAudit === true || 
        reqInfo.canSearchAuditHistory === true ||
        reqInfo.canPlaceOrders === true
      ){
        const insideLink = []
        if (reqInfo.canAudit === true || reqInfo.canCreateJobs === true) insideLink.push({
          text: "Create",
          link: '/Logged/Audit/',
          key: linksKey +=1,
          sub: []
        })
        if (reqInfo.canAudit === true) insideLink.push({
          text: "Edit",
          link: '/Logged/editAudit/',
          key: linksKey +=1,
          sub: []
        })
        if (reqInfo.canAudit === true || reqInfo.canBulkMoveAudit === true) insideLink.push({
          text: "Bulk Move",
          link: '/Logged/bulkMove/',
          key: linksKey +=1,
          sub: []
        })
        if (reqInfo.canAudit === true) insideLink.push({
          text: "Bulk Change",
          link: '/Logged/bulkChange/',
          key: linksKey +=1,
          sub: []
        })
        if (reqInfo.canAudit === true || reqInfo.canPlaceOrders === true || reqInfo.canSearchInventory === true) insideLink.push({
          text: "Search",
          link: '/Logged/SearchAudits/',
          key: linksKey +=1,
          sub: []
        })
        
        if (reqInfo.canSearchAuditHistory === true) insideLink.push({
          text: "History",
          link: "/Logged/search",
          key: linksKey += 1,
          sub: []
        })

        arrayOfLinks.push({
          image: '/pictures/job.svg',
          alt: 'Audit',
          link: '/Logged/Audit/',
          key: linksKey += 1,
          sub: insideLink
        })
      }

      if(reqInfo.canPlaceOrders === true || reqInfo.canOrderHistory === true || reqInfo.canFmvPriceChange === true){
        const insideLink = []
        if (reqInfo.canPlaceOrders === true)
          insideLink.push({
            text: "Create",
            link: "/Logged/orders",
            key: linksKey += 1,
            sub: []
          })
        if (reqInfo.canPlaceOrders === true)
          insideLink.push({
            text: "Edit",
            link: "/Logged/orders/editOrder",
            key: linksKey += 1,
            sub: []
          })
        if (reqInfo.canFmvPriceChange === true){
          insideLink.push({
            text: "Fmv",
            link: "/Logged/fmvManage",
            key: linksKey += 1,
            sub: []
          })
        }
        if (reqInfo.canOrderHistory === true)
          insideLink.push({
            text: "History",
            link: "/Logged/orders/history",
            key: linksKey += 1,
            sub: []
          })
        arrayOfLinks.push({
          image: '/pictures/orders.svg',
          alt: 'Orders',
          link: '/Logged/orders/',
          key: linksKey += 1,
          sub: insideLink
        })
        
      }

      if(reqInfo.canJobPlacement === true || reqInfo.canManipulateClass === true || reqInfo.canAuditOrderManage === true){
        const insideLink = []
        if (reqInfo.canJobPlacement === true) 
        insideLink.push({
          text: "Job Placement",
          link: '/Logged/jobPlacement/JobPlacement',
          key: linksKey +=1,
          sub: []
        })
        if (reqInfo.canManipulateClass === true)
        insideLink.push({
          text: "Class",
          link: '/Logged/ClassRegistry/',
          key: linksKey +=1,
          sub: []
        })

        if (reqInfo.canAuditOrderManage === true)
        insideLink.push({
          text: "Order Manage",
          link: '/Logged/orderManage/',
          key: linksKey +=1,
          sub: []
        })
        arrayOfLinks.push({
          image: '/pictures/register.svg',
          alt: 'Registry',
          link: '/Logged/jobPlacement/JobPlacement',
          key: linksKey += 1,
          sub: insideLink
        })
      }

      if (reqInfo.canEmployeeStatistics === true)
      arrayOfLinks.push({
        image: '/pictures/statistics.svg',
        alt:'Reports',
        link: '/Logged/reports',
        key: linksKey += 1,
        sub: [
          {
            text: "Employee",
            link: "/Logged/reports/Employee",
            key: linksKey += 1,
            sub: []
          }
        ]
      })

      const accountLinks = []
      if (reqInfo.canRegisterPerson === true)
      accountLinks.push({
        text: "Register/Edit",
        link: "/Logged/RegisterEmployee/Register",
        key: linksKey += 1,
        sub: []
      })
      accountLinks.push({
        text: "Change Password",
        link: "/Logged/ChangePassword",
        key: linksKey += 1,
        sub: []
      })
      arrayOfLinks.push({
        image: '/pictures/about.svg',
        alt:'Account',
        link: '/Logged/RegisterEmployee/Register',
        key: linksKey += 1,
        sub: accountLinks
      })

      const insLink = []
      insLink.push({
        text: "Announcements",
        link: "/Logged/",
        key: linksKey += 1,
        sub: []
      })
      if(reqInfo.canAnnounce === true)
      insLink.push({
        text: "Set Announces",
        link: "/Logged/Announcements",
        key: linksKey += 1,
        sub: []
      }) 
      insLink.push({
        text: "Reminders",
        link: "/Logged/ReminderManager",
        key: linksKey += 1,
        sub: []
      })
      if (reqInfo.canDriveR2 === true)
      insLink.push({
        text: "Drive Report",
        link: "/Logged/drives",
        key: linksKey += 1,
        sub: []
      })
      arrayOfLinks.push({
        image: '/pictures/others.svg',
        alt:'Others',
        link: '/Logged/',
        key: linksKey += 1,
        sub: insLink
      })
      res.status(200).json({success: arrayOfLinks})
      
    }
    catch(error){
      console.error(error.message)
      res.status(200).json({error: "Talk to a system administrator"})
    }
  else res.status(200).json({error: "only GET is accepted"})

}


export default validateLoginHeader(userTokenIdent, handler)