<?php

$config = include 'mailConfig.php';

extract($config);

if (!empty($_POST['name']) && !empty($_POST['email']) && !empty($_POST['comment'])) {
	if(filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)){
		require_once 'class.phpmailer.php';
		require_once 'class.smtp.php';

		$mail = new PHPMailer;

		$message = '
		<html>
			<head>
				<title>Your Site Contact Form</title>
			</head>
			<body>
				<h3>Name: <span style="font-weight: normal;">' . $_POST['name'] . '</span></h3>
				<h3>Email: <span style="font-weight: normal;">' . $_POST['email'] . '</span></h3>
				<div>
					<h3 style="margin-bottom: 5px;">Comment:</h3>
					<div>' . $_POST['comment'] . '</div>
				</div>
			</body>
		</html>';

		if($Smtp){

			$mail->isSMTP();
			$mail->Host = $SmtpHost;
			$mail->SMTPAuth = true;
			$mail->Username = $SmtpUser;
			$mail->Password = $SmtpPass;
			$mail->SMTPSecure = $SmtpSecure;
			$mail->Port = $SmtpPort;

		}

		$mail->setFrom($from);
		$mail->addAddress($to);
		$mail->isHTML(true);

		$mail->Subject = $subject;
		$mail->Body    = $message;


		if(!$mail->send()) {
			echo "<span class='text-danger'>{$mail->ErrorInfo}</span>";
		} else {
 			echo '<span class="text-success send-true">Your email was sent!</span>';
		}

	}
	else {
		echo '<span class="text-danger wrong-email">Please specify correct e-mail!</span>';
	}
} else {
	echo '<span class="text-danger">All fields must be filled!</span>';
}
?>
