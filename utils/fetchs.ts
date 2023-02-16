export const jFetch = async (url: string, method: string, data: any = {}): Promise<any> => {
  try {
    const svrResp = await fetch(window.location.origin + "/api/" + url + "/", { 
      method: method,
      credentials: 'same-origin',
      headers: {
        "Content-Type" : "application/json",
      },
      body: JSON.stringify(data)
    })
    if (svrResp.status !== 200) return {error: "Could not retrieve information from the server"}
    return svrResp.json();
  } catch (error) {
    return {error}
  }
}
export const picFetch = async(imageName: string) => {
  console.log(window.location.origin + "/pictures/" + imageName)
  try{
    const svrResp = await fetch(window.location.origin + "/pictures/" + imageName, { 
      method: "GET",
      credentials: 'same-origin',
    })
    
    if (svrResp.status !== 200) return {error: "Could not retrieve information from the server"}
    const blob = await svrResp.blob()
    const file = await blob.arrayBuffer()
    return file;
  }
  catch (error){
    return {error}
  }
}

export const getFetch = async (url: string): Promise<any> => {
  try {
    const svrResp = await fetch(window.location.origin + "/api/" + url + "/", { 
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        "Content-Type" : "application/json",
      },
    })
    if (svrResp.status !== 200) return {error: "Could not retrieve information from the server"}
    return svrResp.json();
  } catch (error) {
    return {error}
  }
}