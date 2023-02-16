import { NextApiRequest, NextApiResponse } from 'next';
import { userLoginInfo } from '../../schemas/user';
import { getIdentToken } from '../../database/postgres/login';
import { validatePost } from '../../schemas/dataValidation';
import { setHeaderCookies } from '../../utils/customCookies';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const pgResp = await getIdentToken(req);
    if (pgResp.success){
      setHeaderCookies(res, pgResp.ident, pgResp.token)
      res.status(200).json({success: 'Logged in', change_pass: pgResp.change_pass})
    }
    
    else if (pgResp.info) return res.status(200).json(pgResp)
    else return res.status(401).json(pgResp)
  } catch (error) {
    console.error(error)
    res.status(400).json({error: "Internal server error"})
  }
}

export default validatePost(userLoginInfo, handler);