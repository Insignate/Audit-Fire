export default function Custom404() {
  return <div>
    <style jsx>{`
      div{
        display: flex;
        justify-content: center;
        align-content: center;
        height: 100%;
        background: radial-gradient(var(--background-error-color),var(--background));
        flex-direction: column;
      }
      h1{
        margin-left: auto;
        margin-right: auto;
        font-size: 3em;
        border: solid 4px red;
        padding: 8px;
        border-radius: var(--obj-border-radius);
        color: red;
      }
      h3{
        margin-top: 6px;
        margin-left: auto;
        margin-right: auto;
        font-size: 1.5em;
        border: solid 4px red;
        padding: 8px;
        border-radius: var(--obj-border-radius);
        color: red;
      }
    `}</style>
    <h1>404 - Page Not Found</h1><br />
    <h3>You need to re-log to the system (press F5)<br />
    Or you are not allowed to view this page</h3>
  </div>
}