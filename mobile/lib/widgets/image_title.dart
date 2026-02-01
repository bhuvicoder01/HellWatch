import 'package:flutter/material.dart';

class ImageTitle extends StatelessWidget {
  final String assetPath;
  final String fallbackText;
  final double height;
  final double width;

  const ImageTitle({
    super.key,
    required this.assetPath,
    required this.fallbackText,
    this.height = 40,
    this.width = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      assetPath,
      height: height,
      width: width,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return Text(
          fallbackText,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        );
      },
    );
  }
}