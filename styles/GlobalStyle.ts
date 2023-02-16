import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root{/*default dark theme*/

    color-scheme: dark;

    --foreground: white;
    --background: black;

    --background-error-color: #500;

    --nav-background: #222;
    --nav-img-filter: invert(90%);
    --nav-link-drop-shadow: drop-shadow(1px 1px 1px #777);
    --nav-link-text-shadow: 1px 1px 1px #777;

    --label-text-shadow: 1px 1px 1px #777;

    --obj-border-color: #DDD;

    --table-td-color: #333;



    /*window*/
    --window-background-radient: #444;
    --window-background-radient2: #444;
    --window-border-color: #DDD;
    --window-border-color2: #DDD;
    --window-box-shadow: var(--box-shadow-config2) #999;
    --window-box-shadow2: var(--box-shadow-config) #777;

    --window-attention-background-radient: #200;
    --window-attention-background-radient2: #400;
    --window-attention-border-color: #ff001d;
    --window-attention-border-color2: #c40219;
    --window-attention-box-shadow: var(--box-shadow-config2) #c40219;
    --window-attention-box-shadow2: var(--box-shadow-config) #792f37;

    --window-read-background-radient: #181c18;
    --window-read-background-radient2: #2f4a2e;
    --window-read-border-color: #05ff00; 
    --window-read-border-color2: #06c402;
    --window-read-box-shadow: var(--box-shadow-config2) #06c402;
    --window-read-box-shadow2: var(--box-shadow-config) #30792f;

    --window-lookup-background-radient: #002;
    --window-lookup-background-radient2: #006;
    --window-lookup-border-color: #2020FF;
    --window-lookup-border-color2: #3030FF;
    --window-lookup-box-shadow: var(--box-shadow-config2) #0210c4;
    --window-lookup-box-shadow2: var(--box-shadow-config) #022ec4;

    --window-alert-background-radient: #221400;
    --window-alert-background-radient2: #442800;
    --window-alert-border-color: #FFA500;
    --window-alert-border-color2: #BB6500;
    --window-alert-box-shadow: var(--box-shadow-config2) #CC7500;
    --window-alert-box-shadow2: var(--box-shadow-config) #884800;

    --add-container: #060;
    --remove-container: #800;

    /*input box*/
    --input-border-focus: #F91;
    --input-border-focus-valid: #3F3;
    --input-border-focus-invalid: #F33;

    /*button*/
    --btn-border-submit: #0B0;
    --btn-border-hover-submit: #090;
    --btn-border-active-submit: #0F0;
    --btn-background-submit: #010;
    --btn-background-hover-submit: #030;
    --btn-background-active-submit: #060;

    --btn-audit-close: #ff001d;
    --btn-audit-hover-close: #c40219;
    --btn-audit-active-close: #792f37;

    --btn-neutral: #000;
    --btn-neutral-hover: #333;
    --btn-neutral-active: #111;

    --btn-border-remove: #A00;
    --btn-remove: #200;
    --btn-border-hover-remove: #F00;
    --btn-background-hover-remove: #222;
    --btn-border-active-remove: #A00;
    --btn-background-active-remove: #400;

    --btn-border-add: #0A0;
    --btn-add: #040;

    /* loading */
    --load-border-color: #FFA500;
    --load-inner-color: #CC8200;
    --load-shadow-color: #7F5200;

    --nav-link-gradient1: #522;
    --nav-link-gradient2: #844;

    /*generics (everything below and inside :root) */

    --animation-loop: infinite;
    --animation-duration: 10s;

    --box-shadow-config: 0 0 5px 5px;
    --box-shadow-config2: 0 0 5px 5px;

    /*borders */
    --obj-border-size: 3px;
    --obj-border-radius: 6px;

    --window-border-size: 3px;
    --window-border-radius: 8px;

    /*transition times */
    --fast-transition: .3s;


    /*screen sizes */
    --screen-min-width: 600px;
    --screen-medium-width: 860px;
    --screen-big-width: 1080px;

    --table-header: #0FF;
    --tr-hover-alert: #850;
    --tr-hover-attention: #792f37;
    --tr-hover-lookup: #2222FF;
    --table-cell-edit: var(--background);
    
    --read-section-hover #171;

    /*form labels*/

    --copying-from-main: #0F0;
  }

  [data-theme="bright"] {
    color-scheme: white;
    --foreground: black;
    --background: white;

    --background-error-color: #FAA;
    --label-text-shadow: 1px 1px 1px #AAA;

    --nav-img-filter: invert(0%);

    --nav-background: rgb(220,220,220);

    --table-td-color: #CCC;

    --obj-border-color: rgb(50,50,50);
    --window-border-color: rgb(50,50,50);

    --window-read-background-radient: #EFE;
    --window-read-background-radient2: #CFC;
    --window-read-border-color: #7F7; 
    --window-read-border-color2: #4A4;
    --window-read-box-shadow: var(--box-shadow-config) #0D0;
    --window-read-box-shadow2: var(--box-shadow-config) #0A0;

    --window-attention-background-radient: #FEE;
    --window-attention-background-radient2: #FCC;
    --window-attention-border-color: #F33;
    --window-attention-border-color2: #F00;
    --window-attention-box-shadow: var(--box-shadow-config2) #F77;
    --window-attention-box-shadow2: var(--box-shadow-config) #FAA;

    --window-lookup-background-radient: #EEF;
    --window-lookup-background-radient2: #AAF;
    --window-lookup-border-color: #33F;
    --window-lookup-border-color: #00F;
    --window-lookup-box-shadow: var(--box-shadow-config2) #77F;
    --window-lookup-box-shadow2: var(--box-shadow-config) #AAF;

    --window-alert-background-radient: #FFDDAA;
    --window-alert-background-radient2: #DDCC99;
    --window-alert-border-color: #FFA500;
    --window-alert-border-color2: #BB6500;
    --window-alert-box-shadow: var(--box-shadow-config2) #CC7544;
    --window-alert-box-shadow2: var(--box-shadow-config) #884822;

    --add-container: #AFA;
    --remove-container: #F77;

    /*button */
    --btn-border-submit: #0B0;
    --btn-border-hover-submit: #090;
    --btn-border-active-submit: #0F0;
    --btn-background-submit: #EFE;
    --btn-background-hover-submit: #CFC;
    --btn-background-active-submit: #9F9;

    --btn-neutral: #FFF;
    --btn-neutral-hover: #DDD;
    --btn-neutral-active: #EEE;

    --btn-audit-close: #C77;
    --btn-audit-hover-close: #E77;
    --btn-audit-active-close: #A77;

    --btn-border-remove: #F33;
    --btn-remove: #FCC;
    --btn-border-hover-remove: #F00;
    --btn-background-hover-remove: #FFF;
    --btn-border-active-remove: #F44;
    --btn-background-active-remove: #FAA;

    --btn-border-add: #0A0;
    --btn-add: #CFC;

    --tr-hover-alert: #FA5;
    --tr-hover-attention: #FAA;
    --tr-hover-lookup: #88F;

    --table-header: #00F;

    --nav-link-gradient1: #AFA;
    --nav-link-gradient2: #8D8;

    --read-section-hover #9F9;

    /*form labels*/

    --copying-from-main: #0B0;
  }

  [data-theme="red"]{
    --foreground: black;
    --background: red;

    --nav-background: rgb(220,0,0);
  }


  a{
    text-decoration: none;
    color: var(--foreground);
  }

  input, button, select, textarea{
    border: solid var(--obj-border-size) var(--obj-border-color);
    border-radius: var(--obj-border-radius);
    background-color: var(--background);
    color: var(--foreground);
    padding: 4px;
  }
  input, button{
    background-color: var(--btn-neutral);
  }
  input:hover, button:hover, textarea:hover{
    background-color: var(--btn-neutral-hover);
  }
  button:active{
    background-color: var(--btn-neutral-active);
  }
  button{
    transition: background-color var(--fast-transition), border-color var(--fast-transition);
  }

  input[type=text], input[type=password], input[type=number]{
    padding: 4px;
    outline: none;
  }
  fieldset{
    padding: 0 6px 6px 6px;
  }

  form input:invalid, 
  form select:invalid, 
  form textarea:invalid, 
  form:invalid input[type=submit],
  .form-type input: invalid,
  .form-type select:invalid, 
  .form-type textarea:invalid, 
  .form-type:invalid input[type=submit]{
    border-color: var(--input-border-focus-invalid);
  }
  
  form input:focus, 
  form select:focus, 
  form textarea:focus,
  .form-type input:focus, 
  .form-type select:focus, 
  .form-type textarea:focus{
    border-color: var(--input-border-focus);
  }
  form input:valid, 
  form select:valid, 
  form textarea:valid,
  .form-type input:valid, 
  .form-type select:valid, 
  .form-type textarea:valid{
    border-color: var(--input-border-focus-valid);
  }
  
  label{
    text-shadow: var(--label-text-shadow);
  }

  .custom-icons{
    filter: var(--nav-img-filter) var(--nav-link-drop-shadow);
  }

  .btn-submit{
    border-color: var(--btn-border-submit);
    background-color: var(--btn-background-submit);
  }
  .btn-submit:hover{
    border-color: var(--btn-border-hover-submit);
    background-color: var(--btn-background-hover-submit);
  }
  .btn-submit:active{
    border-color: var(--btn-border-active-submit);
    background-color: var(--btn-background-active-submit);
  }
  .btn-red-submit{
    border-color: var(--btn-border-remove);
    background-color: var(--btn-remove);
  }
  .btn-red-submit:hover{
    border-color: var(--btn-border-hover-remove);
    background-color: var(--btn-background-hover-remove)
  }
  .btn-red-submit:active{
    border-color: var(--btn-border-active-remove);
    background-color: var(--btn-background-active-remove)
  }

  .window{
    border: solid var(--window-border-size) var(--window-border-color);
    border-radius: var(--window-border-radius);
    padding: 6px;
  }
  .window table td{
    transition: background-color var(--fast-transition);
  }
  
  .window button, .window input[type="submit"]{
    padding: 2px 6px;
    font-size: 16px;
  }
  
  .window hr{
    border: solid calc(var(--window-border-size) / 2) var(--window-border-color);
    border-radius: var(--window-border-radius);
  }
  .window fieldset{
    border-radius: 6px;
  }


  .shadow-neutral{
    transition: box-shadow var(--fast-transition);
  }

  .shadow-neutral:hover{
    box-shadow: var(--window-box-shadow);
  }
  .shadow-neutral-activate{
    box-shadow: var(--window-box-shadow);
    transition: box-shadow var(--fast-transition);
  }

  .window-alert{
    background: radial-gradient(var(--window-alert-background-radient), var(--window-alert-background-radient2));
    animation: window-alert-anim var(--animation-loop) var(--animation-duration);
  }
  .window-alert hr, .window-alert fieldset{
    animation: obj-alert-anim var(--animation-loop) var(--animation-duration);
  }

  .window-read{
    background: radial-gradient(var(--window-read-background-radient), var(--window-read-background-radient2));
    animation: window-read-anim var(--animation-loop) var(--animation-duration);
  }
  .window-read hr{
    animation: obj-read-anim var(--animation-loop) var(--animation-duration);
  }
  .window-lookup{
    background: radial-gradient(var(--window-lookup-background-radient), var(--window-lookup-background-radient2));
    animation: window-lookup-anim var(--animation-loop) var(--animation-duration);
  }
  .window-lookup hr, .window-lookup fieldset{
    animation: obj-lookup-anim var(--animation-loop) var(--animation-duration);
  }
  .adding-container{
    background-color: var(--add-container);
  }
  .removing-container{
    background-color: var(--remove-container);
  }

  .btn-change-option{
    border-color: #55F;
  }
  .window-attention{
    background: radial-gradient(var(--window-attention-background-radient), var(--window-attention-background-radient2));
    animation: window-attention-anim var(--animation-loop) var(--animation-duration);
  }
  .window-attention hr, .window-attention fieldset{
    animation: obj-attention-anim var(--animation-loop) var(--animation-duration);
  }
  .window tr:nth-child(even) td{
    background-color: var(--table-td-color);
  }
  .window tr td:first-of-type{
    border-top-left-radius: var(--obj-border-radius);
    border-bottom-left-radius: var(--obj-border-radius);
  }
  .window tr td:last-of-type{
    border-top-right-radius: var(--obj-border-radius);
    border-bottom-right-radius: var(--obj-border-radius);
  }
  .window tr td:first-of-type{
    text-align: right;
    padding: 0 6px;
  }
  .window table td label{
    display: block;
  }
  .window table{
    border-collapse: collapse;
  }
  .window-alert tr:hover > td, .window-alert .hover-container:hover{
    background-color: var(--tr-hover-alert);
  }
  .window-attention tr:hover > td, .window-attention .hover-container:hover{
    background-color: var(--tr-hover-attention);
  }
  .window-lookup tr:hover > td, .window-lookup .hover-container:hover{
    background-color: var(--tr-hover-lookup);
  }
  .window-read tr:hover > td, .window-read .hover-container:hover{
    background-color: var(--tr-hover-read);
  }
  .window-read .hover-color{
    border-radius: var(--obj-border-radius);
  }
  .window-read .hover-color:hover{
    background-color: var(--read-section-hover);
  }
  .themed-image, .themed-image > *{
    filter: var(--nav-img-filter) var(--nav-link-drop-shadow);
    width: 40px;
    height: 40px;
  }

  .obj-attention{
    border-color: var(--window-border-color);
    border-width: var(--window-border-size);
    animation: obj-attention-anim var(--animation-loop) var(--animation-duration);
  }

  .obj-read{
    border-color: var(--window-border-color);
    border-width: var(--window-border-size);
    animation: obj-read-anim var(--animation-loop) var(--animation-duration);
  }
  .audit-table{
    border-collapse: collapse;
  }
  .audit-table tr td{
    padding: 0 4px;
  }
  .audit-table input[type='checkbox']{
    width: 30px;
    height: 30px;
  }
  .audit-size td:nth-child(1){
    width: 120px;
  }
  .audit-size td:nth-child(2){
    max-width: 130px;
  }
  .audit-size td:nth-child(2) input, 
  .audit-size td:nth-child(2) textarea{
    max-width: 120px;
  }
  .audit-size td:nth-child(2) select{
    max-width: 133px;
  }
  .audit-size td:nth-child(3){
    max-width: 30px;
  }
  .audit-table tr:nth-child(even) td:nth-child(1){
    border-top-left-radius: var(--obj-border-radius);
    border-bottom-left-radius: var(--obj-border-radius);
  }
  .audit-table tr:nth-child(even) td:nth-child(3){
    border-top-right-radius: var(--obj-border-radius);
    border-bottom-right-radius: var(--obj-border-radius);
  }
  .fields-selected td > label:hover{
    color: red;
  }
  .rg-celleditor{
    background-color: var(--table-cell-edit);
  }
  .audit-container .price input{
    max-width: 64px;
  }
  .btn-removing{
    background-color: var(--btn-remove);
    border-color: var(--btn-border-remove);
  }
  .btn-adding{
    background-color: var(--btn-add);
    border-color: var(--btn-border-add);
  }
  .adjust-middle-img{
    display: flex;
  }
  .adjust-middle-img > span{
    min-width: 40px;
    min-height: 40px;
    padding-left: 4px;
  }
  .link-button > a{
    display: block;
    border: solid 2px var(--foreground);
    border-radius: var(--obj-border-radius);
    background-color: var(--background);
    padding: 1px 4px;
    transition: background-color var(--fast-transition), border-color var(--fast-transition);
  }
  .link-button > a:hover{
    border-color: var(--btn-border-hover-submit);
    background-color: var(--btn-background-hover-submit);
  }
  .custom-icons{
    display: inline-block;
    
  }  
  .custom-icons > span{
    vertical-align: middle;
  }
  .single-link > a{
    display: flex;
    padding-left: 4px;
  }
  .single-link > a > span{
    min-width: 40px;
    min-height: 40px;
  }
  @keyframes obj-lookup-anim{
    0%{
      border-color: var(--window-lookup-border-color);
    }
    50%{
      border-color: var(--window-lookup-border-color2); 
    }
    100%{
      border-color: var(--window-lookup-border-color); 
    }
  }

  @keyframes obj-read-anim{
    0%{
      border-color: var(--window-read-border-color);
    }
    50%{
      border-color: var(--window-read-border-color2); 
    }
    100%{
      border-color: var(--window-read-border-color); 
    }
  }
  @keyframes obj-alert-anim{
    0%{
      border-color: var(--window-alert-border-color);
    }
    50%{
      border-color: var(--window-alert-border-color2); 
    }
    100%{
      border-color: var(--window-alert-border-color); 
    }
  }
  @keyframes window-alert-anim{
    0%{
      border-color: var(--window-alert-border-color);
      box-shadow: var(--window-alert-box-shadow);
    }
    50%{
      border-color: var(--window-alert-border-color2); 
      box-shadow: var(--window-alert-box-shadow2);
    }
    100%{
      border-color: var(--window-alert-border-color); 
      box-shadow: var(--window-alert-box-shadow);
    }
  }

  @keyframes window-lookup-anim{
    0%{
      border-color: var(--window-lookup-border-color);
      box-shadow: var(--window-lookup-box-shadow);
    }
    50%{
      border-color: var(--window-lookup-border-color2); 
      box-shadow: var(--window-lookup-box-shadow2);
    }
    100%{
      border-color: var(--window-lookup-border-color); 
      box-shadow: var(--window-lookup-box-shadow);
    }
  }

  @keyframes window-read-anim{
    0%{
      border-color: var(--window-read-border-color);
      box-shadow: var(--window-read-box-shadow);
    }
    50%{
      border-color: var(--window-read-border-color2); 
      box-shadow: var(--window-read-box-shadow2);
    }
    100%{
      border-color: var(--window-read-border-color); 
      box-shadow: var(--window-read-box-shadow);
    }
  }

  @keyframes window-attention-anim{
    0%{
      border-color: var(--window-attention-border-color);
      box-shadow: var(--window-attention-box-shadow);
    }
    50%{
      border-color: var(--window-attention-border-color2); 
      box-shadow: var(--window-attention-box-shadow2);
    }
    100%{
      border-color: var(--window-attention-border-color); 
      box-shadow: var(--window-attention-box-shadow);
    }
  }

  @keyframes obj-attention-anim{
    0%{
      border-color: var(--window-attention-border-color);
    }
    50%{
      border-color: var(--window-attention-border-color2); 
    }
    100%{
      border-color: var(--window-attention-border-color); 
    }
  }

`

export default GlobalStyle

export const screenSize = {
  small: 'screen and (max-width: 600px)',
  smallPlus: 'screen and (min-width: 601px)',
  medium: 'screen and (max-width: 860px)',
  big: 'screen and (max-width: 1080px)',
}