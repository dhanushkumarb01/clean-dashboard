const User = require('../models/User');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user data'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your user account was not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch your user data'
    });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const { email, ...updateData } = req.body;
    // Don't allow email updates through this endpoint
    delete updateData.password;
    delete updateData.youtube;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your user account was not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update user data'
    });
  }
};
