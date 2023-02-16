import Head from "next/head"
import { useEffect, useState } from "react"
import { getFetch } from "../../utils/fetchs"

export const Index = () => {
  const [ann, setAnn] = useState([])
  useEffect(() => {
    const getAnnouncements = async () => {
      const svrResp = await getFetch('others/get-announcement');
      if(svrResp.success) setAnn(svrResp.value)
    }
    getAnnouncements()
  }, [])
  return (<div>
    <style jsx>{`
    .window{
      float: left;
      margin: 6px;
      clear: left;
    }
    `}</style>
    <Head>
      <title>Announcements</title>
    </Head>
    <section className="window window-read">
      <h1>Announcements</h1>
      <hr />
      {ann.map(({info}, index) => 
        <p key={index}>
          <label>{info}</label>
        </p>
      )}
    </section>
  </div>)
  
}
export default Index