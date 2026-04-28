export const getOtpHtml = (OTP_CODE) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
      PulseTrack: Almost There! Verify your email with code ${OTP_CODE}
    </div>
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
                      style="margin-top: 30px; margin-bottom: 20px; text-align: center"
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
                              "
                            >
                              Almost There!
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
                      Thank you for choosing PulseTrack. To unlock your activity insights, please
                      verify your email with the code below:
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="
                        background-color: rgb(236, 254, 255);
                        border-style: solid;
                        border-width: 1px;
                        border-color: rgb(207, 250, 254);
                        border-radius: 12px;
                        margin-bottom: 24px;
                        margin-top: 24px;
                        padding-bottom: 25px;
                        padding-top: 25px;
                        text-align: center;
                      "
                    >
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="
                                font-size: 36px;
                                line-height: 24px;
                                font-weight: 700;
                                letter-spacing: 12px;
                                color: rgb(30, 41, 59);
                                margin: 0rem;
                                margin-top: 0rem;
                                margin-bottom: 0rem;
                                margin-left: 0rem;
                                margin-right: 0rem;
                              "
                            >
                              ${OTP_CODE}
                            </p>
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
                      Enter this code on the verification screen. It expires in
                      <strong style="color: rgb(51, 65, 85)">10 minutes</strong> (at 14:10 PM UTC).
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
                            <p
                              style="
                                font-size: 12px;
                                line-height: 20px;
                                color: rgb(100, 116, 139);
                                margin-top: 10px;
                                margin-bottom: 0rem;
                              "
                            >
                              Didn&#x27;t request this? You can safely ignore this email; your
                              account security is uncompromised.
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
  </body>
</html>
`;
