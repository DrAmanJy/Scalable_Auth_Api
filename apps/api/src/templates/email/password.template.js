export const getResetPasswordHtml = (
  USER_NAME,
  RESET_LINK,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body
    style="
      background-color: rgb(236, 254, 255);
      margin-top: 0;
      margin-bottom: 0;
      margin-right: 0;
      margin-left: 0;
      padding-right: 0;
      padding-left: 0;
    "
  >
    <!--$--><!--html--><!--head-->
    <div
      style="
        display: none;
        overflow: hidden;
        line-height: 1px;
        opacity: 0;
        max-height: 0;
        max-width: 0;
      "
      data-skip-in-text="true"
    >
      Reset your PulseTrack password
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center"
    >
      <tbody>
        <tr>
          <td
            style="
              background-color: rgb(236, 254, 255);
              font-family:
                ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
                'Segoe UI Symbol', 'Noto Color Emoji';
              margin-bottom: auto;
              margin-top: auto;
              margin-right: auto;
              margin-left: auto;
              padding-right: 0.5rem;
              padding-left: 0.5rem;
            "
          >
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="
                max-width: 465px;
                border-style: solid;
                border-width: 1px;
                border-color: rgb(241, 245, 249);
                border-radius: 20px;
                margin-bottom: 40px;
                margin-top: 40px;
                margin-right: auto;
                margin-left: auto;
                padding: 30px;
                background-color: rgb(255, 255, 255);
                box-shadow:
                  0 0 rgb(0, 0, 0, 0),
                  0 0 rgb(0, 0, 0, 0),
                  0 0 rgb(0, 0, 0, 0),
                  0 0 rgb(0, 0, 0, 0),
                  0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)),
                  0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
              "
            >
              <tbody>
                <tr style="width: 100%">
                  <td>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top: 16px; text-align: center"
                    >
                      <tbody>
                        <tr>
                          <td>
                            <h1
                              style="
                                color: rgb(30, 41, 59);
                                font-size: 26px;
                                font-weight: 700;
                                padding: 0rem;
                                margin-bottom: 0rem;
                                margin-top: 0rem;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 0.5rem;
                              "
                            >
                              <span style="color: rgb(6, 182, 212); font-size: 30px">♥</span>
                              PulseTrack
                            </h1>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="margin-top: 30px; margin-bottom: 20px"
                    >
                      <tbody>
                        <tr>
                          <td>
                            <h1
                              style="
                                color: rgb(51, 65, 85);
                                font-size: 20px;
                                font-weight: 600;
                                margin: 0rem;
                                text-align: center;
                              "
                            >
                              Password Reset Request
                            </h1>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 22px;
                        color: rgb(71, 85, 105);
                        margin-top: 16px;
                        margin-bottom: 16px;
                      "
                    >
                      Hi
                      ${USER_NAME},
                    </p>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 22px;
                        color: rgb(71, 85, 105);
                        margin-top: 16px;
                        margin-bottom: 16px;
                      "
                    >
                      Someone recently requested a password change for your PulseTrack account. If
                      this was you, you can set a new password by clicking the button below:
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="text-align: center; margin-top: 32px; margin-bottom: 32px"
                    >
                      <tbody>
                        <tr>
                          <td>
                            <a
                              href="${RESET_LINK}"
                              style="
                                line-height: 100%;
                                text-decoration: none;
                                display: inline-block;
                                max-width: 100%;
                                mso-padding-alt: 0px;
                                background-color: rgb(6, 182, 212);
                                border-radius: 0.25rem;
                                color: rgb(255, 255, 255);
                                font-size: 14px;
                                font-weight: 600;
                                text-decoration-line: none;
                                text-align: center;
                                padding-right: 24px;
                                padding-left: 24px;
                                padding-bottom: 12px;
                                padding-top: 12px;
                              "
                              target="_blank"
                              ><span
                                ><!--[if mso
                                  ]><i style="mso-font-width: 400%; mso-text-raise: 18" hidden
                                    >&#8202;&#8202;&#8202;</i
                                  ><!
                                [endif]--></span
                              ><span
                                style="
                                  max-width: 100%;
                                  display: inline-block;
                                  line-height: 120%;
                                  mso-padding-alt: 0px;
                                  mso-text-raise: 9px;
                                "
                                >Reset Password</span
                              ><span
                                ><!--[if mso
                                  ]><i style="mso-font-width: 400%" hidden
                                    >&#8202;&#8202;&#8202;&#8203;</i
                                  ><!
                                [endif]--></span
                              ></a
                            >
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="
                        font-size: 14px;
                        line-height: 22px;
                        color: rgb(71, 85, 105);
                        margin-top: 16px;
                        margin-bottom: 16px;
                      "
                    >
                      If you don&#x27;t want to change your password or didn&#x27;t request this,
                      just ignore and delete this message.
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top-style: solid;
                        border-top-width: 1px;
                        border-style: solid;
                        border-color: rgb(241, 245, 249);
                        text-align: center;
                      "
                    >
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="
                                font-size: 12px;
                                line-height: 20px;
                                color: rgb(100, 116, 139);
                                margin: 0rem;
                                margin-top: 0rem;
                                margin-bottom: 0rem;
                                margin-left: 0rem;
                                margin-right: 0rem;
                              "
                            >
                              PulseTrack Inc., 123 Analytics Way, San Francisco, CA
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`;
